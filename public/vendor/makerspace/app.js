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
    $('#scanCardModal').hide(0, () => {
        $('#loadingModal').show()
    })
}

$(".openCardModalBtn").click(() => {
    $('#scanCardModal').fadeIn('fast')
    $('#input-cardID').focus()
})

$('#scanCardModal .box').click(() => {
    $('#input-cardID').focus()
})

$('#scanCardModal .modal-background').click(() => {
    $('#input-cardID').focus()
})

$("#remarkField").change(() => {
    $("#openCardModalBtn-NonShift").attr("disabled", true)

    if ($("#remarkField").val() === "null%") {
        $("#openCardModalBtn-NonShift").attr("disabled", true)
        $("#otherFieldsContainer").slideUp()
        return false
    }

    if ($("#remarkField").val() === "others%") {
        $("#otherFieldsContainer").slideDown()
        $("#otherFields").attr("required", true)

        return false
    }

    $("#otherFieldsContainer").slideUp()
    $("#otherField").attr("required", false)
})

$("#otherField").on('keyup', () => {
    if ($("#otherField").val() === "") {
        $("#openCardModalBtn-NonShift").attr("disabled", true)
        return false
    }

    $("#openCardModalBtn-NonShift").attr("disabled", false)
})