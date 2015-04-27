Handlebars.registerHelper('default', function(value, defaultValue) {
    return value || defaultValue;
}, 'safe:string|number', 'string|number');

Handlebars.registerHelper('format-date', function(value) {
    var arr = value.split('-');
    if (arr.length === 0) {
        return;
    }
    var months = ['none', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return arr[2] + ' ' + months[parseInt(arr[1])] + ' ' + arr[0];
});
