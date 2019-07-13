import * as Yup from 'yup';
import {
  startOfHour,
  isBefore,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const page = req.query.page || 1;
    const where = {};

    // If date is specified, returns requested meetups
    if (req.query.date) {
      const date = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(date), endOfDay(date)],
      };
    }

    const meetup = await Meetup.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
      order: ['date', 'title'],
    });

    return res.json(meetup);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      file_id: Yup.number().required(),
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.string().required(),
    });

    // Validate req.body values
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const date = startOfHour(parseISO(req.body.date));

    // Check if is a past date
    if (isBefore(date, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const user_id = req.userId;

    // Check date availability
    const checkAvailability = await Meetup.findOne({
      where: {
        user_id,
        date,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'You already have a meetup for this date and time' });
    }

    // Create a new meetup with logged user as the owner
    const meetup = await Meetup.create({
      ...req.body,
      user_id,
      date,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      file_id: Yup.number(),
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
    });

    // Validate req.body values
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user_id = req.userId;
    const meetup = await Meetup.findByPk(req.params.id);
    const date = startOfHour(parseISO(req.body.date));

    // Check if found a meetup
    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    // Check if is a past date
    if (isBefore(date, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const checkAvailability = await Meetup.findOne({
      where: {
        user_id,
        date,
      },
    });

    // Check date availability in case there are other meetups
    if (checkAvailability && checkAvailability.id !== meetup.id) {
      return res
        .status(400)
        .json({ error: 'You already have a meetup for this date and time' });
    }

    // Check if meetup already happened or is happening
    if (meetup.past) {
      return res.status(400).json({ error: "You can't update past meetups" });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const user_id = req.userId;
    const meetup = await Meetup.findByPk(req.params.id);

    // Check if found a meetup
    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    // Check if logged user is the owner
    if (meetup.user_id !== user_id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Check if meetup already happened or is happening
    if (meetup.past) {
      return res.status(400).json({ error: "You can't delete past meetups" });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
