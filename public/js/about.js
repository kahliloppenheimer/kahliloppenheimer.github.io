$(document).ready(function() {

    var labels = ['Programmer', 'Writer', 'Student', 'Dota-er']
    var currLabel = 0;

    setInterval(function() {
        currLabel++;
        if (currLabel >= labels.length) {
            currLabel = 0;
        }
        $('#about h3').text(labels[currLabel]);
    }, 1500);

});
