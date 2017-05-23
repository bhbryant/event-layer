var ElectricLove = (function ElectricLove () {
    /**
     * Third-party adapters for ElectricLove.track(), ElectricLove.identify(), etc.
     */
    var thirdPartyAdapters = {
        // Todo: We should handle the case where the user aliases ElectricLove -> window.analytics
        'segment': {
            enabled: true,
            test: function () {
                return window.analytics && window.analytics.Integrations && typeof(window.analytics.Integrations) === 'object';
            },
            identify: function (userId, userProperties) {
                // Send the identify call to Segment's Analytics.js library
                // console.log('Identifying: ', userId, userProperties);
                if (window.analytics && userId) analytics.identify(userId, userProperties);

            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Segment's Analytics.js library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.analytics && eventName) analytics.track(eventName, eventProperties);
            },
            page: function (category, name, properties) {
                // Send the page call to Segment's Analytics.js library
                // console.log('page: ', category, name, properties);
                if (window.analytics && name) analytics.page(category, name, properties);
            },
            alias: function (userId, previousId) {
                // Send the alias call to Segment's Analytics.js library
                // console.log('alias: ', userId, previousId);
                if (window.analytics && userId && previousId) analytics.alias(userId, previousId);
            },
            group: function (groupId, traits) {
                // Send the group call to Segment's Analytics.js library
                // console.log('group: ', groupId, traits);
                if (window.analytics && groupId) analytics.group(groupId, traits);
            }
        },
        'mixpanel': {
            enabled: true,
            test: function () {
                return window.mixpanel && window.mixpanel.__loaded;
            },
            identify: function (userId, userProperties) {
                // Send the identify call to Mixpanel's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.mixpanel && userId) mixpanel.identify(userId);

                // Set people properties on our identified user
                if (window.mixpanel && userProperties) mixpanel.people.set(userProperties);
            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Mixpanel's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.mixpanel && eventName) mixpanel.track(eventName, eventProperties);
            }
        },
        'heap': {
            enabled: true,
            test: function () {
                return (window.heap && window.heap.track) ? true : false;
            },
            identify: function (userId, userProperties) {
                // Send the identify call to Heap's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.heap && userId) heap.identify(userId);

                // Set people properties on our identified user
                if (window.heap && userProperties) heap.addUserProperties(userProperties);
            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Heap's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.heap && eventName) heap.track(eventName, eventProperties);
            }
        },
        'intercom': {
            enabled: true,
            test: function () {
                return (window.Intercom && window.Intercom('getVisitorId')) ? true : false;
            },
            identify: function (userId, userProperties) {
                // Send the identify call to Intercom's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.Intercom && userId)
                    Intercom('update', { user_id: userId });

                // Set people properties on our identified user
                if (window.Intercom && userProperties)
                    Intercom('update', userProperties);
            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Intercom's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.Intercom && eventName)
                    Intercom('trackEvent', eventName, eventProperties);
            }
        },
        'amplitude': {
            enabled: true,
            test: function () {
                return (window.amplitude && window.amplitude.options) ? true : false;
            },
            identify: function (userId, userProperties) {
                // Send the identify call to Amplitude's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.amplitude && userId) amplitude.getInstance().setUserId(userId);

                // Set people properties on our identified user
                if (window.amplitude && userProperties) amplitude.getInstance().setUserProperties(userProperties);
            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Amplitude's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.amplitude && eventName) amplitude.getInstance().logEvent(eventName, eventProperties);
            }
        },
        'google-analytics': {
            enabled: true,
            test: function () {
                return window.ga && window.ga.loaded;
            },
            identify: function (userId, userProperties) {
                if (window.ga) ga('set', 'userId', userId);
            },
            track: function (eventName, eventProperties) {
                if (window.ga) ga('send', {
                    hitType: 'event',
                    eventCategory: 'All',
                    eventAction: eventName
                });
            }
        },
        'keen': {
            enabled: true,
            // Todo: This test sucks (keen is not opinionated as to what global you place it in, but defaults to client, which is too common to use as a test.)
            test: function () {
                return window.Keen && window.Keen.loaded && window.client;
            },
            identify: function (userId, userProperties) {
                if (window.client && userId) client.extendEvents({
                    'user_id': userId
                });

                if (window.client && userProperties) client.extendEvents(userProperties);
            },
            track: function (eventName, eventProperties) {
                if (window.client && eventName) client.recordEvent(eventName, eventProperties);
            }
        },
        'blank-adapter-template': { // Do not modify this template
            enabled: false,
            test: function () {},
            track: function (eventName, eventProperties) {},
            identify: function (userId, userProperties) {},
            page: function (category, name, properties) {},
            alias: function (userId, previousId) {},
            group: function (groupId, traits) {}
        }
    };

    function track (eventName, eventProperties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.track && typeof(adapter.track) === 'function')
                    adapter.track(eventName, eventProperties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function identify (userId, userProperties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.identify && typeof(adapter.identify) === 'function')
                    adapter.identify(userId, userProperties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function page (category, name, properties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        // Handle not passing the category (shift right)
        if (category && (!name || typeof(name) !== 'string')) {
            callback = options;
            options = properties;
            properties = name;
            name = category;
            category = null;
        }

        // url (canonical?), title, referrer, path
        var url = document.querySelector("link[rel='canonical']") ? document.querySelector("link[rel='canonical']").href : document.location.href;
        var title = document.title;
        var referrer = document.referrer;
        var path = location.pathname;

        var props = {
            url: url,
            title: title,
            referrer: referrer,
            path: path
        };

        var properties = Object.assign(props, properties);

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.page && typeof(adapter.page) === 'function')
                    adapter.page(category, name, properties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function group (groupId, traits, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so we can perform a grouping
                if (adapter.group && typeof(adapter.group) === 'function')
                    adapter.group(groupId, traits);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function alias (userId, previousId, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so we can alias this user
                if (adapter.alias && typeof(adapter.alias) === 'function')
                    adapter.alias(userId, previousId);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function ready (callback) {
        if (callback && typeof(callback) === 'function')
            ElectricLove.readyFunction = callback;
    }

    function onReady () {
        if (!ElectricLove.readyFunction) return;

        if (ElectricLove.readyFunction && typeof(ElectricLove.readyFunction) === 'function') ElectricLove.readyFunction();

        ElectricLove.readyFunction = null;
    }

    // Execute directly before the first track/identify/page/group/alias call, or after a default timeout (5s)
    setTimeout(onReady, 5000);


    // Todo:
    // QueryString API?
    // Selecting Integrations should match analytics.js syntax?


    // Create / export globals
    window.ElectricLove = {};
    ElectricLove.thirdPartyAdapters = thirdPartyAdapters;
    ElectricLove.readyFunction = null;
    ElectricLove.identify = identify;
    ElectricLove.onReady = onReady;
    ElectricLove.track = track;
    ElectricLove.group = group;
    ElectricLove.alias = alias;
    ElectricLove.ready = ready;
    ElectricLove.page = page;

    return function () {
        return ElectricLove;
    };

})();
