<script>
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
</script>


<script>
function sendEmail(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const company = document.getElementById("company").value;
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

    window.location.href = `mailto:dispatch@baysunllc.com subject=${subject}&body=${body}`;
}
</script>
