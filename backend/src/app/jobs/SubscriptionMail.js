import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { user, meetup } = data;

    await Mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: `Nova inscrição - ${meetup.title}`,
      template: 'subscription',
      context: {
        organizer: meetup.User.name,
        meetup: meetup.title,
        user: user.name,
        email: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
