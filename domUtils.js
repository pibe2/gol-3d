/**
 *
 * @param form
 * @param {String} name
 * @returns {String}
 */
function getRadioCheckedVal(form, name) {
    //obtained from http://www.dyn-web.com/tutorials/forms/radio/get-selected.php
    var radios = form.elements[name];
    for (var i=0, len=radios.length; i<len; i++) {
        if ( radios[i].checked ) {
            return radios[i].value;
        }
    }
    return null; // return value of checked radio or undefined if none checked
}

/**
 *
 * @param form
 * @param {String} name
 * @returns {*} -- an HTML DOM
 */
function getRadioChecked(form, name) {
    //obtained from http://www.dyn-web.com/tutorials/forms/radio/get-selected.php
    var radios = form.elements[name];
    for (var i=0, len=radios.length; i<len; i++) {
        if ( radios[i].checked ) {
            return radios[i];
        }
    }
    return null;
}
