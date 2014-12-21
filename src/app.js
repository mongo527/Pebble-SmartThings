/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var Settings = require('settings');
var UI = require('ui');
var ajax = require('ajax');

var baseURL = 'https://graph.api.smartthings.com';
var clientID = '93299720-c3bc-436c-96bd-f0a7fdf1bc82';
var redirectURI = 'http://shawnconroyd.com/pebble/smartthings-callback';

var options = Settings.data();
var config;

var resultsMenu = new UI.Menu();

console.log("Options: " + JSON.stringify(options));

var parseItems = function (data, type) {
    var items = [];
    
    for(var i=0; i < data.length; i++) {
        console.log(data[i].label);
        items.push({
            id: data[i].id,
            title: data[i].label,
            subtitle: data[i].value,
            type: type,
            command: null
        });
        
        if(type == "garageDoors") {
            items.command = "push";
        }
        else {
            items.command = "toggle";
        }
    }
    return items;
};

Settings.config(
    {
        url: baseURL + '/oauth/authorize?response_type=code&client_id=' + clientID + '&scope=app&redirect_uri=' + redirectURI
    },
    function(e) {
        console.log("Opening Configuration");
    },
    function(e) {
        console.log("Configuration Closed");
        config = JSON.parse(decodeURIComponent(e.response));
        Settings.data(config);
        console.log("Options: " + JSON.stringify(config));
        
        if(e.failed) {
            console.log("Failed:" + e.response);
        }
    }
);

function getMenu() {
    var switchItems;
    
    ajax(
        {
            url:baseURL + options.endpointURL + '/switches',
            type:"json",
            headers:{'Authorization': 'Bearer ' + options.accessToken}
        },
        function(data) {
            var switchItems = parseItems(data, "switches");
            console.log("Switches = " + JSON.stringify(switchItems));
            
            var switchSection = {
                title: "Switches",
                items: switchItems
            };
            
            resultsMenu.section(0, switchSection);
        },
        function(e) {
            console.log("Fail: " + e);
        }
    );
    
    ajax(
        {
            url: baseURL + options.endpointURL + '/momentary',
            type:'json',
            headers:{'Authorization': 'Bearer ' + options.accessToken}
        },
        function(data) {
            var menuItems = parseItems(data, "momentary");
            console.log("Momentary = " + JSON.stringify(menuItems));
            for(var i; i < menuItems.length; i++) {
                resultsMenu.Item(0, switchItems.length, menuItems[i]);
            }
            var momentarySection = {
                title: "Momentary",
                items: menuItems
            };
            
            resultsMenu.section(1, momentarySection);
        },
        function(e) {
            console.log("Fail: " + e);
        }
    );
    
    ajax(
        {
            url:baseURL + options.endpointURL + '/locks',
            type:'json',
            headers:{'Authorization': 'Bearer ' + options.accessToken}
        },
        function(data) {
            var menuItems = parseItems(data, "locks");
            console.log("Locks = " + JSON.stringify(menuItems));
            
            var lockSection = {
                title: "Locks",
                items: menuItems
            };
            
            resultsMenu.section(2, lockSection);
        },
        function (e) {
            console.log("Fail: " + e);
        }
    );
    
    ajax(
        {
            url:baseURL + options.endpointURL + '/contactSensors',
            type:'json',
            headers:{'Authorization': 'Bearer ' + options.accessToken}
        },
        function(data) {
            var menuItems = parseItems(data, "contactSensors");
            console.log("Sensors = " + JSON.stringify(menuItems));
            
            var contactSensorsSection = {
                title: "Sensors",
                items: menuItems
            };
            
            resultsMenu.section(3, contactSensorsSection);
        },
        function (e) {
            console.log("Fail: " + e);
        }
    );
}

resultsMenu.on('select', function(e) {
    ajax(
        {
            url:baseURL + options.endpointURL + "/" + e.item.type + "/" + e.item.id,
            method:'PUT',
            type:'json',
            headers:{'Authorization': 'Bearer ' + options.accessToken, 'Content-Type': 'application/json'},
            data:{"command": "toggle"}
        },
        function(error) {
            console.log("Fail: " + JSON.stringify(error));
        },
        function() {
            console.log(e.item.title + ": toggled");
            setTimeout(getMenu(), 1000);
        }
    );
});

resultsMenu.on('longSelect', function() {
    getMenu();
});

getMenu();
resultsMenu.show();