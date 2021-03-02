timeDisplay = () => {
    var timestampNow = new Date()

    $("#time-display").text(timestampNow.toLocaleTimeString())

    var curHr = timestampNow.getHours()

    if (curHr < 10) {
        $("#good-day").html(`<i class="fas fa-moon"></i>&ensp;Closed for the day`);
    } else if (curHr < 12) {
        $("#good-day").html(`Good Morning!`);
    } else if (curHr < 18) {
        $("#good-day").html(`Good Afternoon!`);
    } else if (curHr < 21) {
        $("#good-day").html("Good Evening!");
    } else if (curHr < 24) {
        $("#good-day").html(`<i class="fas fa-moon"></i>&ensp;Closed for the day`);
    }
}

timeDisplay()

setInterval(() => timeDisplay(), 1000)

// setInterval(() => {
//     $('#input-cardID').val("")
// }, 500)

showLoadingModal = () => {
    $('#scanCardModalInner').fadeOut('fast', () => {
        $('loadingModalInner').fadeIn('fast')
    })
}


$(function () {
    $('#scanCardModal').on('shown.bs.modal', function () {
        $('#input-cardID').focus()
    });
    $("#scanCardModal").click(function () {
        $('#input-cardID').focus()
    });
});

// function timeLogged(){
//     var timestampNow = new Date()
//     $("#timeLogged").text(`Logged at ${timestampNow.toLocaleTimeString()}`)
// }
// timeLogged()