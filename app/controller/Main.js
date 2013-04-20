Ext.define("Emergalert.controller.Main", {

    extend: 'Ext.app.Controller',

    config: {

        refs: {
            emergencyLabel: "#emergencyLabel",
            distanceLabel: "#distanceLabel",
            mapComp: "map"
        },

        control: {
            'button[action=readCarData]' : {
                tap: 'plotCarData'
            },
            'button[action=simulateEmergencyData]' : {
                tap: 'simulateEmergencyData'
            },
            'button[action=readAmbulanceData]' : {
                tap: 'plotEmergencyData'
            },
            'button[action=runUnitTest]' : {
                tap: 'plotCarData'
            },
            'button[action=readCarDataReal]' : {
                tap: 'plotRealCarData'
            },
            'button[action=siren]' : {
                tap: 'playSiren'
            },
            'button[action=warning]' : {
                tap: 'playWarning'
            },
            '#neverlostPanel' : {
                tap: 'dismissAlert'
            }
        }

    },
    hideTimer: null,
    lastAlertTime: 0,
    nextHideTime: 0,
    MIN_ALERT_TIME_IN_S: 5,
    vehicles: {},

    launch: function() {
        window.ctl = this;
        console.log("Waiting for map to render");
        this.getMapComp().on("maprender", function() {
            console.log("Map rendered - checking for collision");
            this.getMapComp().getMap().setZoom(16);
            this.updateVehicle("C", 37.4845303, -122.2024975, 0, 0.6707759115381)
            //this.plotEmergencyData();
        }, this)
    },

    runUnitTest: function() {
        this.testCheckForCollision();
    },

    playSiren: function() {
        var me = this;
        Ext.getCmp("sirenAudio").play();
        this.showAlert();
        setTimeout(function() { me.hideAlert(); }, 6000);
    },

    playWarning: function() {
        if (!this.playedWarning)
            Ext.getCmp("warningAudio").play();
        this.playedWarning = true;
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
            if (which == "C")
                marker.setIcon("resources/icons/sportscar.png");
            else
                //console.log("no setting icon")
                marker.setIcon("resources/icons/hospital-building.png");
            o.marker = marker;
        }
        var pos = new google.maps.LatLng(lat, lon)
        marker.setPosition(pos);
        if (which == "C") {
            me.getMapComp().getMap().setCenter(pos);
        }
        me.checkForCollision();
    },

    // move vehicle along its specified heading from specified point for specified distance
    moveVehicle: function(which, start, head, distance) {
        var me = this;
        var deltaX = Math.cos(head) * distance;  // in KM
        var deltaY = Math.sin(head) * distance;
        // below constants from http://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
        var newLat = start.lat + deltaX / 110.54;
        var newLon = start.lon + deltaY / 111.320*Math.cos(start.lat);
        me.updateVehicle(which, newLat, newLon, head, 0) /* dont bother calculating speed at this point);*/
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

    distanceBetweenTwoPoints: function(lat1,lon1, lat2, lon2) {
        var R = 6371.0;
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
        return d;
    },

    // lat long are in deg
    convertToCartesian: function(lat, lon) {
        var R = 6371.0;
        lat = lat * Math.PI / 180.0;
        lon = lon * Math.PI / 180.0;
        return {
            x: R * Math.cos(lat) * Math.cos(lon),
            y: R * Math.cos(lat) * Math.sin(lon)
        }
    },

    bearingBetweenTwoPoints: function(lat2, lon2, lat1, lon1) {
        var R = 6371;
        var pt1 = this.convertToCartesian(lat1, lon1)
        var pt2 = this.convertToCartesian(lat2, lon2);
        var dy = pt2.y - pt1.y;
        var dx = pt2.x - pt1.x;
        var angleInRadian = Math.atan2(dy, dx); //angle in radian
        if (angleInRadian < 0)
            angleInRadian += 2 * Math.PI;
        return angleInRadian;
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

        d = me.distanceBetweenTwoPoints(lat1, lon1, lat2, lon2) / 1.6
        this.getDistanceLabel().setHtml("Distance: " + Number((d).toFixed(2)) + " mi");
        me.inRange = (d < 0.28)
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
            me.drivingPaused = false;
        } else {
            me.nextHideTime = me.lastAlertTime + me.MIN_ALERT_TIME_IN_S*1000;
            me.hideTimer = setTimeout(function() {
                me.showingAlert = false;
                me.drivingPaused = false;
                me.getEmergencyLabel().setHidden(true);
            })            
        }
    },

    dismissAlert: function() {
        var me = this;
        console.log("dismissAlert");
        me.dismissed = true;
        me.getEmergencyLabel().setHidden(true);
        me.showingAlert = false;
        me.drivingPaused = false;
    },

    showAlert: function() {
        var me = this;

        // do not re-show alert once we dismissed
        if (me.dismissed)
            return;

        if (!me.showingAlert) {
            // me.sendSms();
            me.playWarning();
            me.drivingPaused = true;
        }

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
    },

    plotOneLineOfData: function(which, text) {
        var data = JSON.parse(text);
        var gps = data.gps_status
        this.updateVehicle(which, gps.latitude, gps.longitude, gps.heading, gps.bearing);
    },

    plotVehiclePositionFromWebSocket: function(which) {
        console.log("Opening websocket");
        var me = this;
        var count = 0;
        if (this.ws) {
            console.log("webSocket already open!");
            return;
        }
        ws = new WebSocket('ws://192.168.150.1/notif');
        ws.onopen = function(e) {
            console.log('Socket opened');
        };
        ws.onmessage = function(msg) {
            var data = msg.data.split("\n")
            for (var i = 0; i < data.length; i++) {
                if (!(count++ % 10)) {
                    try {
                        me.plotOneLineOfData(which, data[i])
                    } catch (e) {
                        // ignore
                    }

                }
            }
        };
        ws.onclose = function(e) {
            appendTxtNode('Socket closed');
        };
        this.webSocket = ws;
    },



    // reads JSON data from specified file.  Time per entry.  TimePerEntry * 
    plotVehiclePositionFromJson: function(which, filename, clockTimePerEntry, linesPerCall) {
        var points = []
        var me = this;
        Ext.Ajax.request({
            url: "data/" + filename,
            success: function(resp) {
                var lines = resp.responseText.split("\n");
                var i = 0;
                var timer = setInterval(function() {
                    if (which == "C" && me.drivingPaused)
                        return;
                    me.plotOneLineOfData(which, lines[i])
                    i += linesPerCall
                    if (i >= lines.length)
                        clearInterval(timer);
                }, clockTimePerEntry * 1000)
            }
        })

    },

    plotCarData: function() {
        console.log("plotCarData");
        this.dismissed = false;
        this.plotVehiclePositionFromJson("C", "cardata.json", 1, 30)
    },

    plotRealCarData:function() {
        this.dismissed = false;
        this.plotVehiclePositionFromWebSocket("C");
    },

    plotEmergencyData: function() {
        console.log("plotCarData");
        this.dismissed = false;
        this.plotVehiclePositionFromJson("E", "ambulance-broadway.json", 1, 35)        
    },

    simulateEmergencyData: function() {
        console.log("plotEmergencyData");
        var me = this;
        Ext.Ajax.request({
            url: "data/ambulance.json",
            success: function(resp) {
                var lines = resp.responseText.split("\n");
                var route = []
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (line && line != "") {
                        var data = JSON.parse(line);
                        var gps = data.gps_status
                        route.push({
                            lat: gps.latitude,
                            lon: gps.longitude
                        })                        
                    }
                }
                me.simulateDriving("E", route, 10.0)
            }
        })
    },


    // route is a number of lat long points
    simulateDriving: function(which, route, speed) {
        var me = this;
        var routeIdx = 0;
        var driving = true;
        var totalTime = 0;
        var segmentTime = 0;
        var msPerTick = 10000; // 10 seconds

        // in KPH
        var currentSpeed = speed;
        var currentSegment = route[0]
        var nextSegment = route[1];

        // how far have we gone along the current segment
        var currentSegmentDistance = 0;

        // how long is first segment?
        var segmentDistance = me.distanceBetweenTwoPoints( currentSegment.lat, currentSegment.lon, nextSegment.lat, nextSegment.lon);
        var segmentHeading =  me.bearingBetweenTwoPoints( currentSegment.lat, currentSegment.lon, nextSegment.lat, nextSegment.lon);

        console.log("Kicking off driver timer");
        window.driveTimer = setInterval(function() {

            if (routeIdx > route.length - 1) {
                driving = false;
                clearInterval(driveTimer)
            };
            
            // how long are we going to go in this tick (in km)
            var tickDistance = currentSpeed / 3600.0 * msPerTick / 1000;
            if (currentSegmentDistance + tickDistance >= segmentDistance) {
                // move partway along the new segment
                currentSegment = route[routeIdx+1]
                nextSegment = route[routeIdx+2]
                routeIdx++;
                currentSegmentDistance = (currentSegmentDistance + tickDistance - segmentDistance);
                segmentHeading =  me.bearingBetweenTwoPoints(currentSegment.lat, currentSegment.lon, nextSegment.lat, nextSegment.lon);
            } else {
                // move along the current segment
                currentSegmentDistance += tickDistance
            }

            me.moveVehicle(which, currentSegment, segmentHeading, currentSegmentDistance);

        }, 1000)

    },


    sendSms: function() { 
        console.log("sending sms") 
        Ext.Ajax.request(
            { url: 'http://64.34.218.51/sms.php', 
            method: "GET", 
            success: function() {
                console.log("Sent SMS message") }, 
            failure: function() {
            console.log('failed to send SMS message') } }) },

    sendSmsViaTwilio: function() {
        Ext.Ajax.request({
            url: 'https://api.twilio.com/2010-04-01/Accounts/AC6508b2e2326b479977ec9f921b3f17fd/SMS/Messages.json',
            method: "GET",
            parameters: {
                From: "+14088682269",
                To: "+14086230380",
                Body: "Emergency Vehicle is Approaching"
            },
            headers: {
                "Authorization" : "Basic: QUM2NTA4YjJlMjMyNmI0Nzk5NzdlYzlmOTIxYjNmMTdmZDo3OThmOTNlMGQ4ODNjNzJhZjhkMmE2OGY4YTM2OTAwMA=="                
            },
            success: function() {
                console.log("Sent SMS message")
            },
            failure: function() {
                console.log('failed to send SMS message')
            }
        })
    },

    sendSmsTropo: function() {
        var token = '099005612a458847b7bcf8d8518bbbd07f21de6d696cbb1dd39ed61c26b26ac25171773e3c6d75235fafe6cc'
        var url = "https://api.tropo.com/1.0/sessions?action=create&token=" + token + "&numberToDial=4086230380&msg=Emergency Vehicle is Approaching"
        Ext.Ajax.request({
            url: url,
            method: "GET",
            success: function() {
                console.log("Sent SMS message")
            },
            failure: function() {
                console.log('failed to send SMS message')
            }
        })
    }
   

});