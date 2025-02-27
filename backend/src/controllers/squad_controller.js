import Squad from '../models/squad_model';

// Create new squad
const createSquad = async (req, res) => {
  try {
    console.log(req.body);
    const newSquad = new Squad({
      ...req.body,
      createdBy: req.body.createdBy,
    });

    await newSquad.save();
    return res.status(201).json(newSquad);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Get all squads
const getAllSquads = async (req, res) => {
  try {
    const squads = await Squad.find().populate('members', 'firstName lastName');
    return res.json(squads);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// fetch squad by ID
const getSquadById = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadID).populate(
      'members',
      'firstName lastName',
    );
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    return res.json(squad);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Add a member to squad
const addMemberToSquad = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadID);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });

    if (squad.members.includes(req.body.userID)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    squad.members.push(req.body.userID);
    await squad.save();
    return res.json(squad);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Remove a member from squad
const removeMemberFromSquad = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadID);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });

    squad.members = squad.members.filter((member) => {
      return member.toString() !== req.params.userID;
    });
    await squad.save();
    return res.json(squad);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete squad
const deleteSquad = async (req, res) => {
  try {
    await Squad.findByIdAndDelete(req.params.squadID);
    return res.json({ message: 'Squad deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  createSquad,
  getAllSquads,
  getSquadById,
  addMemberToSquad,
  removeMemberFromSquad,
  deleteSquad,
};
