module.exports.date = getDate;

function getDate (){
let getdate = new Date();
let option = {
    month:'long',
    day: 'numeric'
};
let date = getdate.toLocaleDateString("en-US",option);
return date;
};


function getDay (){
    let getday = new Date();
    let option = {
        day: 'numeric'
    };
    let day = getday.toLocaleDateString("en-US",option);
    return day;
    };
    module.exports.day = getDay;