import { Op } from 'sequelize';
import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';

class SubscriptionController {
  async index(req, res) {
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
      order: [[Meetup, 'date', dateOrder]],
    });

    return res.json(subscription);
  }

  async store(req, res) {
    const user_id = req.userId;

    const meetup = await Meetup.findByPk(req.params.id);

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
          as: 'meetup',
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

    return res.json(subscription);
  }
}

export default new SubscriptionController();
