Ext.define("Emergalert.controller.Main", {

    extend: 'Ext.app.Controller',

    config: {

        refs: {
            emergencyLabel: "#emergencyLabel"
        },

        control: {
        }

    },

    launch: function() {
        window.ctl = this;
    }

});