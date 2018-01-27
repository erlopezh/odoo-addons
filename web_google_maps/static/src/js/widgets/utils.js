odoo.define('web_google_maps.Utils', function (require) {
    'use strict';

    var rpc = require("web.rpc");

    var GOOGLE_PLACES_COMPONENT_FORM = {
        street_number: 'long_name',
        route: 'long_name',
        intersection: 'short_name',
        political: 'short_name',
        country: 'short_name',
        administrative_area_level_1: 'long_name',
        administrative_area_level_2: 'short_name',
        administrative_area_level_3: 'short_name',
        administrative_area_level_4: 'short_name',
        administrative_area_level_5: 'short_name',
        colloquial_area: 'short_name',
        locality: 'short_name',
        ward: 'short_name',
        sublocality_level_1: 'short_name',
        sublocality_level_2: 'short_name',
        sublocality_level_3: 'short_name',
        sublocality_level_5: 'short_name',
        neighborhood: 'short_name',
        premise: 'short_name',
        postal_code: 'short_name',
        natural_feature: 'short_name',
        airport: 'short_name',
        park: 'short_name',
        point_of_interest: 'long_name'
    };

    function fetchValues(model, field_name, value) {
        var def = $.Deferred(),
            res = {};

        if (model && value) {
            rpc.query({
                'model': model,
                'method': 'search_read',
                'args': [['|', ['name', '=', value], ['code', '=', value]], ['display_name',]]
            }).then(function (record) {
                res[field_name] = _.first(record) || false;
                def.resolve(res);
            });
        } else {
            res[field_name] = value;
            def.resolve(res);
        }
        return def;
    }

    function gmaps_get_geolocation(place, options) {
        var vals = {};
        _.each(options, function (alias, field) {
            if (alias === 'latitude') {
                vals[field] = place.geometry.location.lat();
            } else if (alias === 'longitude') {
                vals[field] = place.geometry.location.lng();
            }
        });
        return vals;
    }

    function gmaps_populate_places(place, place_options) {
        var values = {}, vals;

        _.each(place_options, function (option, field) {
            if (option instanceof Array && !_.has(values, field)) {
                vals = _.filter(_.map(option, function (opt) {
                    return place[opt] || false;
                }));
                values[field] = _.first(vals) || "";
            } else {
                values[field] = place[option] || "";
            }
        });
        return values;
    }

    function gmaps_populate_address(place, address_options, delimiter) {
        var address_options = address_options || {},
            fields_delimiter = delimiter || {
                street: " ",
                street2: ", "
            },
            fields_to_fill = {},
            options, temp, result = {};

        // initialize object key and value
        _.each(address_options, function (value, key) {
            fields_to_fill[key] = [];
        });

        _.each(address_options, function (options, field) {
            // turn all fields options into an Array
            options = _.flatten([options]);
            temp = {};
            _.each(place.address_components, function (component) {
                _.each(_.intersection(options, component.types), function (match) {
                    temp[match] = component[GOOGLE_PLACES_COMPONENT_FORM[match]] || false;
                });
            });
            fields_to_fill[field] = _.map(options, function (item) {
                return temp[item];
            });
        });

        _.each(fields_to_fill, function (value, key) {
            var dlmter = fields_delimiter[key] || ' ';
            if (key == 'city') {
                result[key] = _.first(_.filter(value)) || '';
            } else {
                result[key] = _.filter(value).join(dlmter);
            }
        });

        return result;
    }
    return {
        'GOOGLE_PLACES_COMPONENT_FORM': GOOGLE_PLACES_COMPONENT_FORM,
        'gmaps_populate_address': gmaps_populate_address,
        'gmaps_populate_places': gmaps_populate_places,
        'gmaps_get_geolocation': gmaps_get_geolocation,
        'fetchValues': fetchValues
    }
});