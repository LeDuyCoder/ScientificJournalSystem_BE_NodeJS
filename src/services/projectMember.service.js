import pool from "../config/database.js";
import crypto from "crypto";
import { emailHelper } from "../utils/email.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get all members of a project
 */
const getProjectMembers = async (projectId) => {
  const query = `
    SELECT p.project_id AS project_member_id, p.project_id, p.user_id, 'OWNER' AS role, 'ACCEPTED' AS status, p.created_at AS invited_at, p.created_at AS accepted_at,
           u.first_name, u.last_name, u.email
    FROM "Project" p
    JOIN "user" u ON p.user_id = u.user_id
    WHERE p.project_id = $1

    UNION ALL

    SELECT pm.project_member_id, pm.project_id, pm.user_id, pm.role, pm.status, pm.invited_at, pm.accepted_at,
           u.first_name, u.last_name, u.email
    FROM "Project_Member" pm
    JOIN "user" u ON pm.user_id = u.user_id
    WHERE pm.project_id = $1
  `;
  const { rows } = await pool.query(query, [projectId]);
  return rows;
};

/**
 * Invite a user to a project
 */
const inviteMember = async (projectId, email, role, inviterId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if user exists
    const userRes = await client.query('SELECT user_id, first_name, last_name FROM "user" WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      throw new Error("Người dùng với email này không tồn tại trong hệ thống.");
    }
    const user = userRes.rows[0];

    // 2. Check if project exists
    const projectRes = await client.query('SELECT title FROM "Project" WHERE project_id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      throw new Error("Dự án không tồn tại.");
    }
    const project = projectRes.rows[0];

    // 3. Check inviter info
    const inviterRes = await client.query('SELECT first_name, last_name FROM "user" WHERE user_id = $1', [inviterId]);
    const inviterName = inviterRes.rows.length > 0 ? `${inviterRes.rows[0].first_name} ${inviterRes.rows[0].last_name}` : "Admin";

    // 4. Check if member already in project
    const memberRes = await client.query('SELECT * FROM "Project_Member" WHERE project_id = $1 AND user_id = $2', [projectId, user.user_id]);
    
    // We will create a JWT token for the invite
    const inviteToken = jwt.sign({ projectId, userId: user.user_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    if (memberRes.rows.length > 0) {
      const existingMember = memberRes.rows[0];
      if (existingMember.status === 'ACCEPTED') {
        throw new Error("Người dùng đã là thành viên của dự án này.");
      }
      // Update existing invite
      await client.query(`
        UPDATE "Project_Member" 
        SET role = $1, status = 'INVITED', invited_by = $2, invited_at = NOW(), invited_email = $5 
        WHERE project_id = $3 AND user_id = $4
      `, [role, inviterId, projectId, user.user_id, email]);
    } else {
      // Insert new invite
      await client.query(`
        INSERT INTO "Project_Member" (project_id, user_id, role, status, invited_by, invited_email) 
        VALUES ($1, $2, $3, 'INVITED', $4, $5)
      `, [projectId, user.user_id, role, inviterId, email]);
    }

    await client.query('COMMIT');

    // Send Email
    await emailHelper.sendProjectInviteEmail(email, project.title, inviterName, inviteToken);

    return { message: "Đã gửi lời mời thành công." };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Accept an invitation
 */
const acceptInvite = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { projectId, userId } = decoded;

    const res = await pool.query(`
      UPDATE "Project_Member"
      SET status = 'ACCEPTED', accepted_at = NOW()
      WHERE project_id = $1 AND user_id = $2 AND status = 'INVITED'
      RETURNING *
    `, [projectId, userId]);

    if (res.rows.length === 0) {
      // Check if already accepted
      const checkRes = await pool.query(`SELECT status FROM "Project_Member" WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);
      if (checkRes.rows.length > 0 && checkRes.rows[0].status === 'ACCEPTED') {
        return { message: "Bạn đã tham gia dự án này rồi." };
      }
      throw new Error("Lời mời không hợp lệ hoặc đã bị hủy.");
    }

    return { message: "Đã chấp nhận lời mời tham gia dự án." };
  } catch (error) {
    if (error.message === "Lời mời không hợp lệ hoặc đã bị hủy.") {
      throw error;
    }
    throw new Error("Token không hợp lệ hoặc đã hết hạn.");
  }
};

/**
 * Update member role
 */
const updateMemberRole = async (projectId, userId, newRole) => {
  const res = await pool.query(`
    UPDATE "Project_Member"
    SET role = $1
    WHERE project_id = $2 AND user_id = $3
    RETURNING *
  `, [newRole, projectId, userId]);

  if (res.rows.length === 0) {
    throw new Error("Thành viên không tồn tại trong dự án.");
  }
  return res.rows[0];
};

/**
 * Remove a member from a project
 */
const removeMember = async (projectId, userId) => {
  const res = await pool.query(`
    DELETE FROM "Project_Member"
    WHERE project_id = $1 AND user_id = $2
    RETURNING *
  `, [projectId, userId]);

  if (res.rows.length === 0) {
    throw new Error("Thành viên không tồn tại trong dự án.");
  }
  return res.rows[0];
};

export default {
  getProjectMembers,
  inviteMember,
  acceptInvite,
  updateMemberRole,
  removeMember
};
