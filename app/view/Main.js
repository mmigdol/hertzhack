Ext.define('Emergalert.view.Main', {
    extend: 'Ext.Panel',
    xtype: 'main',
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
                                centered: true,
                                bottom: 180,
                                html: "Emergency Vehicle Nearby!",
                                left: 385,
                                style: "display:block; background-color: red; color: black; margin-left:auto; margin-right:auto"
                            }
                        ]
                    },
                    {
                        xtype: 'panel',
                        height: "50%",
                        html: 'other controls go here'
                    }
                ]
            }
        ]
    }
});
