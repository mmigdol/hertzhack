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
                        height: "50%",
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
                                bottom: 220,
                                html: "Emergency Vehicle Nearby!",
                                left: 385,
                                style: "display:block; background-color: red; color: black; margin-left:auto; margin-right:auto"
                            }
                        ],
                        initialize: function() {
                          this.relayEvents(this.element, ['tap']);
                        }
                    },
                    {
                        xtype: 'panel',
                        height: "50%",
                        items: [
                            {
                                xtype: "toolbar",
                                items: [
                                    {
                                        text: "Read Car Data",
                                        action: "readCarData"
                                    },
                                    {
                                        text: "Read Ambulance Data",
                                        action: "readAmbulanceData"
                                    },
                                    {
                                        text: "Run Unit Test",
                                        action: "runUnitTest"
                                    },
                                    {
                                        text: "Siren",
                                        action: "siren"
                                    },
                                    {
                                        id: "sirenAudio",
                                        xtype: "audio",
                                        url: "resources/sounds/siren.wav",
                                        label: "Siren"
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
