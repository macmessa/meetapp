import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';

class OrganizingController {
  async index(req, res) {
    const page = req.query.page || 1;
    const where = { user_id: req.userId };

    // If date is specified, returns requested meetups
    if (req.query.date) {
      const date = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(date), endOfDay(date)],
      };
    }

    const meetup = await Meetup.findAll({
      where,
      limit: 10,
      offset: 10 * page - 10,
      order: ['date', 'title'],
    });

    return res.json(meetup);
  }
}

export default new OrganizingController();
