Ext.define("Emergalert.controller.Main", {

    extend: 'Ext.app.Controller',

    config: {

        refs: {
            emergencyLabel: "#emergencyLabel",
            mapComp: "map"
        },

        control: {
        }

    },
    hideTimer: null,
    lastAlertTime: 0,
    nextHideTime: 0,
    MIN_ALERT_TIME_IN_S: 10,
    vehicles: {},

    launch: function() {
        window.ctl = this;
        console.log("Waiting for map to render");
        this.getMapComp().on("maprender", function() {
            console.log("Map rendered - checking for collision");
            this.getMapComp().getMap().setZoom(15);
            this.testCheckForCollision();
        }, this)
    },

    // which is unique identifier for the vehicle to update - "E" for emergency vehicle, "C" for car
    // spped in KPH, heading in radians (pi/2 radians in circle)
    updateVehicle: function(which, lat, lon, heading, speed) {
        var me = this;
        if (!me.vehicles[which])
            me.vehicles[which] = {}
        var o = me.vehicles[which]

        o.lat = lat;
        o.lon = lon;
        o.heading = heading;
        o.speed = speed;
        var marker = o.marker
        if (!marker) {
            marker = new google.maps.Marker();
            marker.setMap(me.getMapComp().getMap())
            o.marker = marker;
        }
        var pos = new google.maps.LatLng(lat, lon)
        marker.setPosition(pos);
        if (which == "C") {
            me.getMapComp().getMap().setCenter(pos);
        }
        me.checkForCollision();
    },

    // let vehicle continue on its current trajectory for n seconds
    idleVehicle: function(which, time) {
        var me = this;
        var head = me.vehicles[which].heading
        var speed = me.vehicles[which].speed;
        var deltaX = Math.cos(head) * time * speed / 3600;  // in KM
        var deltaY = Math.sin(head) * time * speed / 3600;
        // below constants from http://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
        var newLat = me.vehicles[which].lat + deltaX / 110.54;
        var newLon = me.vehicles[which].lon + deltaY / 111.320*Math.cos(me.vehicles[which].lat);
        me.updateVehicle(which, newLat, newLon, head, speed);
    },

    checkForCollision: function() {
        var me = this;
        if (!me.vehicles.C || !me.vehicles.E)
            // if locations have not been set yet, don't bother
            return;

        // Simple first estimate:  just test distance between two vehicles < 1 mile
        var R = 6371; // km

        var lat2 = me.vehicles.C.lat;
        var lat1 = me.vehicles.E.lat;
        var lon2 = me.vehicles.C.lon;
        var lon1 = me.vehicles.E.lon;

        function deg2rad(deg) {
          return deg * (Math.PI/180)
        }

        var dLat = deg2rad(lat2-lat1);
        var dLon = deg2rad(lon2-lon1);
        var lat1 = deg2rad(lat1);
        var lat2 = deg2rad(lat2);

        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // in KM

        me.inRange = (d < 1.6)
        if (me.inRange) // miles per KM
            me.showAlert();
        else
            me.hideAlert();
    },

    // showAlert always shows the alert for at least MIN_ALERT_TIME_IN_S seconds
    // hideAlert will hide the alert if it has already been shown that time
    // showAlert will cancel a pending hide
    hideAlert: function() {
        var me = this;
        var now = +new Date;
        if (now - me.lastAlertTime > me.MIN_ALERT_TIME_IN_S*1000) {
            me.getEmergencyLabel().setHidden(true);
            me.showingAlert = false;
        } else {
            me.nextHideTime = me.lastAlertTime + me.MIN_ALERT_TIME_IN_S*1000;
            me.hideTimer = setTimeout(function() {
                me.showingAlert = false;
                me.getEmergencyLabel().setHidden(true);
            })            
        }
    },

    showAlert: function() {
        var me = this;
        var now = +new Date;
        me.getEmergencyLabel().setHidden(false);        
        me.lastAlertTime = now;
        me.showingAlert = true;
        clearTimeout(me.hideTimer);
    },

    failTest: function() {
        Ext.Logger.warn("Test Failed!");
        Ext.Msg.alert("Test Failed!")
        throw new Error();
    },

    testCheckForCollision: function() {    
        var me = this;

        // two vehicles in same position should alert
        me.updateVehicle("E", 37.4845303, -122.2024975, 0, 10)
        me.updateVehicle("C", 37.4845303, -122.2024975, 0, 0.6707759115381)
        if (!me.showingAlert)
            me.failTest();

        // if E is going 10KPH, 6.2 MPH, it should be 1 mile away in 580 seconds
        me.idleVehicle("E", 580);
        if (!me.showingAlert) 
            me.failTest();

        me.idleVehicle("E", 20);
        if (me.inRange)
            me.failTest();

        setTimeout(me.MIN_ALERT_TIME_IN_S + 1, function() {
            if (me.showingAlert)
                me.failTest();
        })
    }

});