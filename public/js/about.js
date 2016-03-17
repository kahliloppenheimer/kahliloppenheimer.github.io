$(document).ready(function() {

    $('.about-desc').textillate(
        {
            minDisplayTime: 1000,
            initialDelay: 0,
            in: {effect: 'fadeInDownBig', delay: 30},
            out: { delay: 30, effect: 'hinge', shuffle: true},
            loop: true,
            selector: '.texts'
        });
});
