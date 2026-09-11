'use client';

import { useState } from 'react';

export type Student = {
  id: number;
  name: string;
  classroomId: number;
  classroomName: string;
  ageBand?: string;
  approved?: boolean;
};

export type Classroom = {
  id: number;
  name: string;
  code: string;
  ageBand?: string;
  students?: Array<{ id: number; name: string; approved?: boolean }>;
};

export default function TeacherProfileSection({
  teacherName,
  teacherEmail,
  churchName,
  classes,
  onUpdateTeacher,
  onUpdateChurch,
  onAddStudent,
  onRemoveStudent,
}: {
  teacherName: string;
  teacherEmail: string;
  churchName: string;
  classes: Classroom[];
  onUpdateTeacher: (name: string, email: string, phone: string, title: string) => void;
  onUpdateChurch: (church: string, address: string, website: string) => void;
  onAddStudent: (classroomId: number, studentName: string, ageBand: string) => void;
  onRemoveStudent: (classroomId: number, studentId: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'church' | 'students' | 'security'>('profile');
  const [toastMessage, setToastMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editChurchOpen, setEditChurchOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [removeConfirmStudent, setRemoveConfirmStudent] = useState<{ classroomId: number; studentId: number; studentName: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState(teacherName);
  const [formEmail, setFormEmail] = useState(teacherEmail || 'teacher@church.org');
  const [formPhone, setFormPhone] = useState('+1 (555) 728-1920');
  const [formTitle, setFormTitle] = useState('Lead Sunday School Teacher');
  const [formChurchName, setFormChurchName] = useState(churchName || 'Grace Community Church');
  const [formChurchAddress, setFormChurchAddress] = useState('150 Faith Boulevard, Lagos');
  const [formChurchWebsite, setFormChurchWebsite] = useState('https://gracechurch.org');

  // Add student form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState<number>(classes[0]?.id || 1);
  const [newStudentAgeBand, setNewStudentAgeBand] = useState('Ages 8–11');
  const [studentError, setStudentError] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    onUpdateTeacher(formName.trim(), formEmail.trim(), formPhone.trim(), formTitle.trim());
    setEditProfileOpen(false);
    showToast('Teacher profile details saved successfully!');
  }

  function handleSaveChurch(e: React.FormEvent) {
    e.preventDefault();
    if (!formChurchName.trim()) return;
    onUpdateChurch(formChurchName.trim(), formChurchAddress.trim(), formChurchWebsite.trim());
    setEditChurchOpen(false);
    showToast('Church and organization details updated!');
  }

  function handleAddStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    if (!newStudentName.trim()) {
      setStudentError('Please enter the student’s name.');
      return;
    }
    onAddStudent(newStudentClass, newStudentName.trim(), newStudentAgeBand);
    setAddStudentOpen(false);
    setNewStudentName('');
    showToast(`Added ${newStudentName.trim()} to class roster!`);
  }

  function handleRemoveStudentConfirm() {
    if (removeConfirmStudent) {
      onRemoveStudent(removeConfirmStudent.classroomId, removeConfirmStudent.studentId);
      showToast(`Removed ${removeConfirmStudent.studentName} from classroom.`);
      setRemoveConfirmStudent(null);
    }
  }

  // Aggregate all students across classes
  const allStudents = classes.flatMap((cls) =>
    (cls.students || []).map((st) => ({
      ...st,
      classroomId: cls.id,
      classroomName: cls.name,
      ageBand: cls.ageBand || 'Ages 8–11',
    }))
  );

  return (
    <div className="profile-container">
      {toastMessage && (
        <div className="profile-toast" role="status" aria-live="polite">
          <span>✓</span>
          <p>{toastMessage}</p>
        </div>
      )}

      {/* ── Breadcrumb & Top Bar ── */}
      <div className="profile-top-breadcrumbs">
        <span>Settings</span>
        <span className="breadcrumb-separator">›</span>
        <strong>Educator &amp; Church Profile</strong>
      </div>

      {/* ── Profile Header (Matching Graziele Lopes & Sara Smith Reference) ── */}
      <div className="profile-header-card">
        <div className="profile-cover-banner" />
        <div className="profile-header-content">
          <div className="profile-avatar-wrap">
            <span className="profile-avatar-circle teacher-gradient">
              {teacherName[0]?.toUpperCase() || 'T'}
            </span>
          </div>

          <div className="profile-header-details">
            <div className="profile-title-row">
              <h2>{teacherName}</h2>
              <span className="profile-status-badge verified">✓ Verified Educator</span>
            </div>
            <p className="profile-sub-title">
              {formTitle} · {churchName || 'Community Church'}
            </p>
            <div className="profile-meta-row">
              <span>✉ {formEmail}</span>
              <span>•</span>
              <span>📞 {formPhone}</span>
              <span>•</span>
              <span className="profile-status-badge active"><span className="profile-status-badge-dot" /> Active Educator</span>
            </div>
          </div>

          <div className="profile-header-actions">
            <button
              type="button"
              className="profile-btn-primary"
              onClick={() => {
                setFormName(teacherName);
                setFormEmail(teacherEmail);
                setEditProfileOpen(true);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* ── Tabs (Matching Sara Smith Reference) ── */}
        <div className="profile-tabs-bar">
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Teacher Profile
          </button>
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'church' ? 'active' : ''}`}
            onClick={() => setActiveTab('church')}
          >
            Church &amp; School
          </button>
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Classrooms &amp; Students ({allStudents.length})
          </button>
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security &amp; Credentials
          </button>
        </div>
      </div>

      {/* ── TAB 1: Teacher Profile Details ── */}
      {activeTab === 'profile' && (
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Personal &amp; Professional Information</h3>
              <button
                type="button"
                className="profile-card-edit-icon"
                onClick={() => setEditProfileOpen(true)}
                title="Edit Personal Information"
              >
                ✎
              </button>
            </div>
            <div className="profile-data-grid">
              <div className="profile-data-cell">
                <small>Full Name</small>
                <strong>{teacherName}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Role / Ministry Title</small>
                <div className="profile-pill-val">{formTitle}</div>
              </div>
              <div className="profile-data-cell">
                <small>Primary Email</small>
                <div className="profile-val-with-status">
                  <strong>{formEmail}</strong>
                  <span className="profile-status-chip">Verified</span>
                </div>
              </div>
              <div className="profile-data-cell">
                <small>Contact Phone</small>
                <strong>{formPhone}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Associated Church/School</small>
                <strong>{churchName || 'Test school'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Classrooms Managed</small>
                <strong>{classes.length} learning circles</strong>
              </div>
              <div className="profile-data-cell full-width">
                <small>Teaching Vision</small>
                <p className="profile-text-val">
                  Helping young believers discover the truth of Scripture through interactive stories, real-life faith decisions, and encouraging accountability.
                </p>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Teaching Credentials &amp; Badges</h3>
            </div>
            <div className="profile-credentials-list">
              <div className="profile-credential-item">
                <span className="credential-icon">🛡️</span>
                <div className="profile-info-block">
                  <strong>Ministry Safety &amp; Background Checked</strong>
                  <small>Verified for child-safe education · Renewed 2026</small>
                </div>
                <span className="profile-status-chip">Current</span>
              </div>
              <div className="profile-credential-item">
                <span className="credential-icon">📜</span>
                <div className="profile-info-block">
                  <strong>Scripture Curriculum Certification</strong>
                  <small>Lantern &amp; Lion Certified Sunday School Instructor</small>
                </div>
                <span className="profile-status-chip">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Church & School Details (Requested: change school / church name) ── */}
      {activeTab === 'church' && (
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Church &amp; Sunday School Organization</h3>
              <button
                type="button"
                className="profile-card-edit-icon"
                onClick={() => setEditChurchOpen(true)}
                title="Edit Church Information"
              >
                ✎
              </button>
            </div>
            <div className="profile-data-grid">
              <div className="profile-data-cell full-width">
                <small>Church or School Name</small>
                <strong>{churchName || 'Test school'}</strong>
              </div>
              <div className="profile-data-cell full-width">
                <small>Physical Address / Campus</small>
                <strong>{formChurchAddress}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Official Website</small>
                <strong>{formChurchWebsite}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Total Enrolled Students</small>
                <strong>{allStudents.length} learners</strong>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Assigned Age Bands</h3>
            </div>
            <div className="profile-age-bands-list">
              <div className="profile-age-band-pill">
                <span>🌱 Ages 5–7</span>
                <small>Early Explorers</small>
              </div>
              <div className="profile-age-band-pill active">
                <span>🏮 Ages 8–11</span>
                <small>The Lantern Club</small>
              </div>
              <div className="profile-age-band-pill active">
                <span>🦁 Ages 13–16</span>
                <small>Lion’s Den Teen Circle</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Classrooms & Students (Requested: add student, remove student) ── */}
      {activeTab === 'students' && (
        <div className="profile-children-section">
          <div className="profile-section-bar">
            <div>
              <h3>Classroom Rosters &amp; Students</h3>
              <p>Add new learners directly to your classroom, manage join permissions, or remove student profiles.</p>
            </div>
            <button
              type="button"
              className="profile-btn-primary"
              onClick={() => {
                setNewStudentClass(classes[0]?.id || 1);
                setAddStudentOpen(true);
              }}
            >
              + Add Student to Class
            </button>
          </div>

          {allStudents.length === 0 ? (
            <div className="profile-empty-card">
              <span>👨‍🏫</span>
              <h4>No students in your roster yet</h4>
              <p>Click &quot;+ Add Student to Class&quot; to enroll your first learner or share your class join code.</p>
            </div>
          ) : (
            <div className="profile-students-table-wrap">
              <table className="profile-students-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Classroom</th>
                    <th>Age Band</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((st) => (
                    <tr key={`${st.classroomId}-${st.id}`}>
                      <td>
                        <div className="profile-table-student-name">
                          <span className="profile-table-avatar">
                            {st.name[0]?.toUpperCase() || 'S'}
                          </span>
                          <strong>{st.name}</strong>
                        </div>
                      </td>
                      <td>{st.classroomName}</td>
                      <td>{st.ageBand}</td>
                      <td>
                        <span className="profile-status-chip">
                          {st.approved !== false ? 'Enrolled' : 'Pending Approval'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="profile-table-remove-btn"
                          onClick={() =>
                            setRemoveConfirmStudent({
                              classroomId: st.classroomId,
                              studentId: st.id,
                              studentName: st.name,
                            })
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Security & Credentials ── */}
      {activeTab === 'security' && (
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-head-title">
                <svg className="profile-card-head-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <h3>Educator Two-Factor Authentication</h3>
              </div>
            </div>
            <p className="profile-modal-help">Enforce 2FA verification when logging in to view student progress or send announcements.</p>
            <label className="profile-toggle-row">
              <span className="profile-status-chip">{twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              />
              <span className="profile-switch" />
            </label>
          </div>

          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-head-title">
                <svg className="profile-card-head-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <h3>Active Educator Session</h3>
              </div>
              <span className="profile-status-chip">Current</span>
            </div>
            <div className="profile-data-grid">
              <div className="profile-data-cell">
                <small>Device</small>
                <strong>Current Desktop Session</strong>
              </div>
              <div className="profile-data-cell full-width">
                <small>Details</small>
                <strong>Teacher workspace · Signed in via secure session</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Teacher Profile ── */}
      {editProfileOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Edit Teacher Profile</h3>
              <button type="button" onClick={() => setEditProfileOpen(false)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="profile-modal-body">
                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="editTeacherName">Teacher Full Name</label>
                    <input
                      id="editTeacherName"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Prince Idoma"
                    />
                  </div>
                  <div className="profile-modal-field">
                    <label htmlFor="editTeacherTitle">Ministry Title / Role</label>
                    <input
                      id="editTeacherTitle"
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Lead Sunday School Teacher"
                    />
                  </div>
                </div>

                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="editTeacherEmail">Teacher Email</label>
                    <input
                      id="editTeacherEmail"
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. teacher@church.org"
                    />
                  </div>
                  <div className="profile-modal-field">
                    <label htmlFor="editTeacherPhone">Phone Number</label>
                    <input
                      id="editTeacherPhone"
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 728-1920"
                    />
                  </div>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button type="button" onClick={() => setEditProfileOpen(false)} className="profile-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="profile-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Church / Organization (Requested) ── */}
      {editChurchOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Edit Church &amp; School Details</h3>
              <button type="button" onClick={() => setEditChurchOpen(false)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSaveChurch}>
              <div className="profile-modal-body">
                <div className="profile-modal-field">
                  <label htmlFor="editChurchName">Church or School Name</label>
                  <input
                    id="editChurchName"
                    type="text"
                    required
                    value={formChurchName}
                    onChange={(e) => setFormChurchName(e.target.value)}
                    placeholder="e.g. Grace Community Church"
                    autoFocus
                  />
                </div>

                <div className="profile-modal-field">
                  <label htmlFor="editChurchAddress">Campus / Physical Address</label>
                  <input
                    id="editChurchAddress"
                    type="text"
                    value={formChurchAddress}
                    onChange={(e) => setFormChurchAddress(e.target.value)}
                    placeholder="e.g. 150 Faith Boulevard, Lagos"
                  />
                </div>

                <div className="profile-modal-field">
                  <label htmlFor="editChurchWebsite">Website URL</label>
                  <input
                    id="editChurchWebsite"
                    type="url"
                    value={formChurchWebsite}
                    onChange={(e) => setFormChurchWebsite(e.target.value)}
                    placeholder="e.g. https://gracechurch.org"
                  />
                </div>
              </div>

              <div className="profile-modal-footer">
                <button type="button" onClick={() => setEditChurchOpen(false)} className="profile-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="profile-btn-primary">
                  Update Church Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Student (Requested) ── */}
      {addStudentOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Add Student to Class Roster</h3>
              <button type="button" onClick={() => setAddStudentOpen(false)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleAddStudentSubmit}>
              <div className="profile-modal-body">
                <p>
                  Enroll a new learner directly into your selected classroom circle.
                </p>

                {studentError && <div className="profile-modal-error">{studentError}</div>}

                <div className="profile-modal-field">
                  <label htmlFor="newStudentName">Student Full Name</label>
                  <input
                    id="newStudentName"
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="e.g. Samuel Okafor"
                    autoFocus
                  />
                </div>

                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="newStudentClassroom">Assign to Classroom</label>
                    <select
                      id="newStudentClassroom"
                      value={newStudentClass}
                      onChange={(e) => setNewStudentClass(Number(e.target.value))}
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-modal-field">
                    <label htmlFor="newStudentAgeBand">Age Group</label>
                    <select
                      id="newStudentAgeBand"
                      value={newStudentAgeBand}
                      onChange={(e) => setNewStudentAgeBand(e.target.value)}
                    >
                      <option value="Ages 5–7">Ages 5–7 (Early Explorers)</option>
                      <option value="Ages 8–11">Ages 8–11 (Lantern Club)</option>
                      <option value="Ages 13–16">Ages 13–16 (Lion’s Den Teens)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button type="button" onClick={() => setAddStudentOpen(false)} className="profile-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="profile-btn-primary">
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Remove Student Confirmation (Requested) ── */}
      {removeConfirmStudent && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Remove {removeConfirmStudent.studentName}?</h3>
              <button type="button" onClick={() => setRemoveConfirmStudent(null)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <div className="profile-modal-body">
              <p>
                Are you sure you want to remove <strong>{removeConfirmStudent.studentName}</strong> from this classroom?
                Their completed activities and submissions will be archived.
              </p>
            </div>
            <div className="profile-modal-footer">
              <button type="button" onClick={() => setRemoveConfirmStudent(null)} className="profile-btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleRemoveStudentConfirm} className="profile-btn-danger">
                Remove Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
