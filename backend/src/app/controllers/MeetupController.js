import * as Yup from 'yup';
import { isBefore, parseISO, startOfHour } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    return res.json();
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

  async delete(req, res) {
    return res.json();
  }
}

export default new MeetupController();
