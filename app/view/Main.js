Ext.define('Emergalert.view.Main', {
    extend: 'Ext.Panel',
    xtype: 'main',
    requires: 'Ext.Ajax',
    config: {
        fullscreen: true,
        layout: "hbox",
        items: [
            {
                xtype: 'map',
                height: "100%",
                width: "50%"
            },
            {
                xtype: 'panel',
                layout: 'vbox',
                width: "50%",
                items: [
                    {
                        id: 'neverlostPanel',
                        xtype: 'container',
                        height: "80%",
                        items: [
                            {                                
                                xtype: "image",
                                height: "100%",
                                width: "100%",
                                src: "resources/images/Hertz-NeverLost.png"
                            },
                            {
                                id: 'emergencyLabel',
                                xtype: "label",
                                hidden: true,
                                centered: true,
                                bottom: 360,
                                html: "Emergency Vehicle Nearby!",
                                left: 370,
                                style: "display:block; background-color: red; color: black; margin-left:auto; margin-right:auto; font-size:1.3em; font-weight:bold"
                            }
                        ],
                        initialize: function() {
                          this.relayEvents(this.element, ['tap']);
                        }
                    },
                    {
                        xtype: 'panel',
                        height: "20%",
                        style: 'background-color: white',
                        items: [
                            {
                                xtype: "toolbar",
                                docked: 'bottom',
                                items: [
                                    {
                                        text: "Read Car Data (file)",
                                        action: "readCarData"
                                    },
                                    {
                                        text: "Read Car Data (real)",
                                        action: "readCarDataReal"
                                    },
                                    {
                                        text: "Read Ambulance Data",
                                        action: "readAmbulanceData"
                                    },
                                    {
                                        text: "Run Unit Test",
                                        action: "runUnitTest",
                                        hidden: true
                                    },
                                    {
                                        text: "Siren",
                                        action: "siren"
                                    },
                                    {
                                        text: "Warning",
                                        action: "warning"
                                    },
                                    {
                                        id: "sirenAudio",
                                        xtype: "audio",
                                        url: "resources/sounds/siren.wav",
                                        label: "Siren"
                                    },
                                    {
                                        id: "warningAudio",
                                        xtype: "audio",
                                        url: "resources/sounds/alarm_warning.wav",
                                        hidden: true
                                    },
                                    {
                                        xtype: "spacer",
                                        width: "10px"
                                    },
                                    {
                                        xtype: "label",
                                        id: "distanceLabel",
                                        html: "Distance:"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
});
