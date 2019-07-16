import { Op } from 'sequelize';
import Mail from '../../lib/Mail';
import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';

class SubscriptionController {
  async index(req, res) {
    const page = req.query.page || 1;
    let dateOp = Op.gt;
    let dateOrder = 'asc';

    // Redefine dateOp to search for past meetups and order descending
    if (req.query.past) {
      dateOp = Op.lt;
      dateOrder = 'desc';
    }

    const subscription = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: {
              [dateOp]: new Date(),
            },
          },
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
      order: [[Meetup, 'date', dateOrder]],
    });

    return res.json(subscription);
  }

  async store(req, res) {
    const user_id = req.userId;
    const user = await User.findByPk(user_id);
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          required: true,
          attributes: ['name', 'email'],
        },
      ],
    });

    // Check if meetup exists
    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    // Check if user is the organizer of the meetup
    if (meetup.user_id === user_id) {
      return res
        .status(400)
        .json({ error: "You can't subscribe to your own meetup" });
    }

    // Check if meetup already happened
    if (meetup.past) {
      return res
        .status(400)
        .json({ error: "You can't subscribe to past meetups" });
    }

    const checkDuplicateSubscription = await Subscription.findOne({
      where: {
        meetup_id: meetup.id,
        user_id,
      },
    });

    // Check if meetup already happened
    if (checkDuplicateSubscription) {
      return res
        .status(400)
        .json({ error: "You've already subscribed to this meetup" });
    }

    const checkMeetupDate = await Subscription.findOne({
      where: { user_id },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    // Check if meetup happens at same date/time of a meetup already subscribed
    if (checkMeetupDate) {
      return res.status(400).json({
        error: "You've already subscribed to a meetup at the same date/time",
      });
    }

    const subscription = await Subscription.create({
      meetup_id: meetup.id,
      user_id,
    });

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

    return res.json(subscription);
  }
}

export default new SubscriptionController();
