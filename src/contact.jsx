import { useState } from "react";
import "./contact.css";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  };

  return (
    <main className="contact-page">
      <section className="contact-shell">
        <aside className="contact-info-panel">
          <p className="contact-kicker">Get In Touch</p>
          <h1>Contact Azaad Safar</h1>
          <p>
            Questions about destinations, bookings, or travel partnerships? Send us a
            message and we will get back to you shortly.
          </p>

          <div className="contact-info-list">
            <article>
              <h2>Email</h2>
              <p>support@azaadsafar.com</p>
            </article>
            <article>
              <h2>Phone</h2>
              <p>+91 98765 43210</p>
            </article>
            <article>
              <h2>Office Hours</h2>
              <p>Mon-Sat, 9:00 AM to 6:00 PM</p>
            </article>
          </div>
        </aside>

        <section className="contact-form-panel">
          <h2>Send a Message</h2>
          <p>Fill out the form and our team will respond soon.</p>

          {submitted ? (
            <p className="contact-success">
              Thanks for contacting us. Your message has been received.
            </p>
          ) : null}

          <form className="contact-form" onSubmit={onSubmit}>
            <label>
              Full Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Enter your name"
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="Enter your email"
                required
              />
            </label>

            <label>
              Subject
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="What is this about?"
                required
              />
            </label>

            <label>
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder="Write your message"
                rows="5"
                required
              />
            </label>

            <button type="submit">Send Message</button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default Contact;
