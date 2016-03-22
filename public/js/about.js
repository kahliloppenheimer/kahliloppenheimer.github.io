$(document).ready(function() {
    shuffleList('#about-desc-list');
    $('.about-desc').textillate(
        {
            minDisplayTime: 1000,
            initialDelay: 0,
            in: {effect: 'fadeInDownBig', delay: 30},
            out: { delay: 30, effect: 'hinge', shuffle: true},
            loop: true,
            selector: '.texts',
        });
});

function shuffleList(listSelector) {
    var ul = document.querySelector(listSelector);
    for (var i = ul.children.length; i >= 0; i--) {
        ul.appendChild(ul.children[Math.random() * i | 0]);
    }
}
