function sendEmail(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const company = document.getElementById("company").value || "N/A";
    const service = document.getElementById("service").value;
    const shipmentDetails = document.getElementById("shipmentDetails").value;

    const subject = encodeURIComponent("New Shipping Quote Request from " + fullName);
    const body = encodeURIComponent(
        `Full Name: ${fullName}\n` +
        `Email: ${email}\n` +
        `Company: ${company}\n` +
        `Service: ${service}\n\n` +
        `Shipment Details:\n${shipmentDetails}`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=dispatch@baysunllc.com&su=${subject}&body=${body}`;

    window.open(gmailUrl, '_blank');
}
