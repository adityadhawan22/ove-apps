let getBackground = function (defaultValue) {
    let background = new URLSearchParams(location.search.slice(1)).get('background') || defaultValue;
    return $.isNumeric('0x' + background) ? '#' + background : background;
};

$(function () {
    $('body').css({
        background: getBackground('222')
    });
});
