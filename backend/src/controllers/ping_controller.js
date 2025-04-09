import Ping from '../models/ping_model';
import User from '../models/user_model';
import Squad from '../models/squad_model';

const createPing = async (req, res) => {
  try {
    const { sender, senderName, message, expiresAt, recipients, squads } =
      req.body;

    if (!sender) {
      return res.status(400).json({ error: 'Sender is required' });
    }

    if (
      (!recipients || recipients.length === 0) &&
      (!squads || squads.length === 0)
    ) {
      return res
        .status(400)
        .json({ error: 'At least one recipient or squad is required' });
    }

    const newPing = new Ping({
      sender,
      senderName,
      // eslint-disable-next-line quotes
      message: message || "Let's grab a meal!",
      expiresAt: expiresAt || new Date(Date.now() + 30 * 60 * 1000), // Default to 30 minutes from now
      recipients: recipients || [],
      squads: squads || [],
      status: 'active',
    });

    if (squads && squads.length > 0) {
      const squadDocs = await Squad.find({ _id: { $in: squads } });

      const squadMembers = new Set();
      squadDocs.forEach((squad) => {
        squad.members.forEach((member) => {
          squadMembers.add(member);
        });
      });

      const uniqueRecipients = new Set(newPing.recipients);
      squadMembers.forEach((member) => {
        return uniqueRecipients.add(member);
      });

      newPing.recipients = Array.from(uniqueRecipients);
    }

    await newPing.save();

    return res.status(201).json(newPing);
  } catch (error) {
    console.error('Error creating ping:', error);
    return res.status(500).json({ error: error.message });
  }
};

const getActivePings = async (req, res) => {
  try {
    const userId = req.verifiedAuthId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userSquads = await Squad.find({ members: userId });
    const userSquadIds = userSquads.map((squad) => {
      return squad._id;
    });

    const now = new Date();

    const activePings = await Ping.find({
      $or: [{ recipients: userId }, { squads: { $in: userSquadIds } }],
      expiresAt: { $gt: now },
      status: 'active',
    })
      .populate('sender', 'firstName lastName email profilePic')
      .populate('squads', 'squadName members');

    const unrespondedPings = activePings.filter((ping) => {
      return !ping.responses.some((response) => {
        return response.recipientId === userId;
      });
    });

    return res.json(unrespondedPings);
  } catch (error) {
    console.error('Error fetching active pings:', error);
    return res.status(500).json({ error: error.message });
  }
};

const respondToPing = async (req, res) => {
  try {
    const { pingId } = req.params;
    const { response } = req.body;

    if (!response || !['accept', 'decline', 'dismiss'].includes(response)) {
      return res.status(400).json({
        error: 'Invalid response',
        message: 'Response must be one of: accept, decline, dismiss',
      });
    }

    const userId = req.verifiedAuthId;

    const ping = await Ping.findById(pingId);

    if (!ping) {
      return res.status(404).json({ error: 'Ping not found' });
    }

    if (ping.status !== 'active' || new Date() > ping.expiresAt) {
      return res.status(400).json({
        error: 'Ping expired',
        message: 'This ping has expired and can no longer be responded to',
      });
    }

    const existingResponse = ping.responses.find((r) => {
      return r.recipientId === userId;
    });
    if (existingResponse) {
      return res.status(400).json({
        error: 'Already responded',
        message: 'You have already responded to this ping',
      });
    }

    ping.responses.push({
      recipientId: userId,
      response,
      respondedAt: new Date(),
    });

    await ping.save();

    return res.json({
      message: 'Response recorded successfully',
      ping,
    });
  } catch (error) {
    console.error('Error responding to ping:', error);
    return res.status(500).json({ error: error.message });
  }
};

const dismissPing = async (req, res) => {
  try {
    const { pingId } = req.params;

    const userId = req.verifiedAuthId;

    const ping = await Ping.findById(pingId);

    if (!ping) {
      return res.status(404).json({ error: 'Ping not found' });
    }

    if (ping.status !== 'active' || new Date() > ping.expiresAt) {
      return res.status(400).json({
        error: 'Ping expired',
        message: 'This ping has expired and can no longer be dismissed',
      });
    }

    const existingResponse = ping.responses.find((r) => {
      return r.recipientId === userId;
    });
    if (existingResponse) {
      return res.status(400).json({
        error: 'Already responded',
        message: 'You have already responded to this ping',
      });
    }

    ping.responses.push({
      recipientId: userId,
      response: 'dismiss',
      respondedAt: new Date(),
    });

    await ping.save();

    return res.json({
      message: 'Ping dismissed successfully',
      ping,
    });
  } catch (error) {
    console.error('Error dismissing ping:', error);
    return res.status(500).json({ error: error.message });
  }
};

const cancelPing = async (req, res) => {
  try {
    const { pingId } = req.params;

    const userId = req.verifiedAuthId;

    const user = await User.findOne({ userID: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ping = await Ping.findById(pingId);

    if (!ping) {
      return res.status(404).json({ error: 'Ping not found' });
    }

    if (ping.sender.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only the sender can cancel a ping',
      });
    }

    if (ping.status !== 'active' || new Date() > ping.expiresAt) {
      return res.status(400).json({
        error: 'Ping expired',
        message: 'This ping has already expired',
      });
    }

    ping.status = 'cancelled';

    // Save updated ping
    await ping.save();

    return res.json({
      message: 'Ping cancelled successfully',
      ping,
    });
  } catch (error) {
    console.error('Error cancelling ping:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  createPing,
  getActivePings,
  respondToPing,
  dismissPing,
  cancelPing,
};
