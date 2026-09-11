'use client';

import { useState } from 'react';

export type Child = {
  id: number;
  name: string;
  age: number;
  group?: 'Children' | 'Teens';
  theme?: string;
  pin?: string;
  password?: string;
  avatar?: string;
};

export type Family = {
  familyName: string;
  country: string;
  children: Child[];
  privateArtwork: boolean;
  teacherMessages: boolean;
  progressEmails: boolean;
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
};

export default function ParentProfileSection({
  parentName,
  parentEmail,
  family,
  connectedClass,
  onUpdateParent,
  onUpdateFamily,
  onUpdateChildPin,
  onAddChild,
  onRemoveChild,
}: {
  parentName: string;
  parentEmail: string;
  family: Family;
  connectedClass?: { id: number; name: string; ageBand: string; code: string; teacher: string } | null;
  onUpdateParent: (name: string, email: string, phone: string) => void;
  onUpdateFamily: (next: Family) => void;
  onUpdateChildPin: (childId: number, nextPin: string) => void;
  onAddChild: (child: Child) => void;
  onRemoveChild: (childId: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'church' | 'security'>('profile');
  const [toastMessage, setToastMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editChildPinOpen, setEditChildPinOpen] = useState<Child | null>(null);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [removeConfirmChild, setRemoveConfirmChild] = useState<Child | null>(null);

  // Edit profile form state
  const [formName, setFormName] = useState(parentName);
  const [formEmail, setFormEmail] = useState(parentEmail || 'family@example.com');
  const [formPhone, setFormPhone] = useState(family.phone || '+1 (555) 349-2810');
  const [formFamilyName, setFormFamilyName] = useState(family.familyName);
  const [formCountry, setFormCountry] = useState(family.country || 'Nigeria');
  const [formAddress, setFormAddress] = useState(family.address || '42 Graceful Way, Lagos');

  // Child PIN form state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Add child form state
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('8');
  const [newChildAvatar, setNewChildAvatar] = useState('lion');
  const [newChildPin, setNewChildPin] = useState('1234');
  const [childError, setChildError] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formFamilyName.trim()) return;

    onUpdateParent(formName.trim(), formEmail.trim(), formPhone.trim());
    onUpdateFamily({
      ...family,
      familyName: formFamilyName.trim(),
      country: formCountry.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
    });
    setEditProfileOpen(false);
    showToast('Profile and family details saved successfully!');
  }

  function handleSaveChildPin(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');
    if (!newPin || newPin.length < 4) {
      setPinError('PIN or password must be at least 4 characters.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }
    if (editChildPinOpen) {
      onUpdateChildPin(editChildPinOpen.id, newPin);
      setEditChildPinOpen(null);
      setNewPin('');
      setConfirmPin('');
      showToast(`Passcode updated for ${editChildPinOpen.name}!`);
    }
  }

  function handleAddChildSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChildError('');
    if (!newChildName.trim()) {
      setChildError('Please enter the child’s name.');
      return;
    }
    const ageNum = parseInt(newChildAge, 10) || 7;
    const group: 'Children' | 'Teens' = ageNum >= 13 ? 'Teens' : 'Children';
    const newChild: Child = {
      id: Date.now(),
      name: newChildName.trim(),
      age: ageNum,
      group,
      theme: 'gentle',
      avatar: newChildAvatar,
      pin: newChildPin || '1234',
    };
    onAddChild(newChild);
    setAddChildOpen(false);
    setNewChildName('');
    setNewChildAge('8');
    setNewChildPin('1234');
    showToast(`Added profile for ${newChild.name}!`);
  }

  function handleRemoveChildConfirm() {
    if (removeConfirmChild) {
      onRemoveChild(removeConfirmChild.id);
      showToast(`Removed child profile for ${removeConfirmChild.name}.`);
      setRemoveConfirmChild(null);
    }
  }

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
        <strong>Parent &amp; Family Profile</strong>
      </div>

      {/* ── Profile Header (Matching Graziele Lopes & Sara Smith Reference) ── */}
      <div className="profile-header-card">
        <div className="profile-cover-banner" />
        <div className="profile-header-content">
          <div className="profile-avatar-wrap">
            <span className="profile-avatar-circle">
              {parentName[0]?.toUpperCase() || 'P'}
            </span>
          </div>

          <div className="profile-header-details">
            <div className="profile-title-row">
              <h2>{parentName}</h2>
              <span className="profile-status-badge verified">✓ Verified Family Account</span>
            </div>
            <p className="profile-sub-title">
              {family.familyName} · {family.children.length} {family.children.length === 1 ? 'child enrolled' : 'children enrolled'}
            </p>
            <div className="profile-meta-row">
              <span>✉ {formEmail}</span>
              <span>•</span>
              <span>📞 {formPhone}</span>
              <span>•</span>
              <span className="profile-status-badge active"><span className="profile-status-badge-dot" /> Active Member</span>
            </div>
          </div>

          <div className="profile-header-actions">
            <button
              type="button"
              className="profile-btn-primary"
              onClick={() => {
                setFormName(parentName);
                setFormEmail(parentEmail);
                setFormFamilyName(family.familyName);
                setFormPhone(family.phone || '+1 (555) 349-2810');
                setFormAddress(family.address || '42 Graceful Way, Lagos');
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
            Family &amp; Account
          </button>
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'children' ? 'active' : ''}`}
            onClick={() => setActiveTab('children')}
          >
            Children Accounts ({family.children.length})
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
            className={`profile-tab-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security &amp; Privacy
          </button>
        </div>
      </div>

      {/* ── TAB 1: Family & Account Information ── */}
      {activeTab === 'profile' && (
        <div className="profile-grid">
          {/* Card 1: Personal Details */}
          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Personal Information</h3>
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
                <strong>{parentName}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Family Name</small>
                <strong>{family.familyName}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Account Role</small>
                <div className="profile-pill-val">Family Owner</div>
              </div>
              <div className="profile-data-cell">
                <small>Country</small>
                <strong>{family.country || 'Nigeria'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Primary Email</small>
                <div className="profile-val-with-status">
                  <strong>{formEmail}</strong>
                  <span className="profile-status-chip">Verified</span>
                </div>
              </div>
              <div className="profile-data-cell">
                <small>Phone Number</small>
                <strong>{formPhone}</strong>
              </div>
              <div className="profile-data-cell full-width">
                <small>Home Address</small>
                <strong>{formAddress}</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Emergency Contact */}
          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Emergency Contact</h3>
              <button
                type="button"
                className="profile-card-edit-icon"
                onClick={() => setEditProfileOpen(true)}
                title="Edit Emergency Contact"
              >
                ✎
              </button>
            </div>
            <div className="profile-data-grid">
              <div className="profile-data-cell">
                <small>Contact Name</small>
                <strong>{family.emergencyContact?.name || 'Ruth Adeyemi'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Relationship</small>
                <strong>{family.emergencyContact?.relationship || 'Spouse'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Emergency Phone</small>
                <strong>{family.emergencyContact?.phone || '+1 (555) 839-4029'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Email</small>
                <strong>{family.emergencyContact?.email || 'ruth.adeyemi@example.com'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Children Accounts Management (Requested: change child password, add child, remove child) ── */}
      {activeTab === 'children' && (
        <div className="profile-children-section">
          <div className="profile-section-bar">
            <div>
              <h3>Enrolled Children Profiles</h3>
              <p>Manage access credentials, student PIN codes, and add or remove profiles without logging out.</p>
            </div>
            <button
              type="button"
              className="profile-btn-primary"
              onClick={() => setAddChildOpen(true)}
            >
              + Add Child Profile
            </button>
          </div>

          <div className="profile-children-cards-grid">
            {family.children.map((ch) => {
              const isTeen = ch.age >= 13;
              return (
                <div key={ch.id} className="profile-child-card">
                  <div className="profile-child-top">
                    <span className="profile-child-avatar-badge">
                      {ch.avatar === 'lion' ? '🦁' : ch.avatar === 'lantern' ? '🏮' : ch.avatar === 'dove' ? '🕊️' : '🌟'}
                    </span>
                    <div className="profile-child-meta">
                      <h4>{ch.name}</h4>
                      <span>
                        Age {ch.age} · <b className={isTeen ? 'teen-pill' : 'kid-pill'}>{isTeen ? 'Teen (13-17)' : 'Child (5-12)'}</b>
                      </span>
                    </div>
                  </div>

                  <div className="profile-child-details">
                    <div className="profile-child-stat">
                      <small>Dashboard View</small>
                      <strong>{isTeen ? "Lion's Den Teen Space" : 'The Lantern Club'}</strong>
                    </div>
                    <div className="profile-child-stat">
                      <small>Secret Access PIN</small>
                      <div className="profile-pin-display">
                        <code>••••</code>
                        <button
                          type="button"
                          className="profile-pin-btn"
                          onClick={() => {
                            setEditChildPinOpen(ch);
                            setNewPin(ch.pin || '');
                            setConfirmPin(ch.pin || '');
                            setPinError('');
                          }}
                        >
                          Change PIN
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="profile-child-actions">
                    <button
                      type="button"
                      className="profile-child-action-btn primary"
                      onClick={() => {
                        setEditChildPinOpen(ch);
                        setNewPin(ch.pin || '');
                        setConfirmPin(ch.pin || '');
                        setPinError('');
                      }}
                    >
                      Reset Password/PIN
                    </button>
                    {family.children.length > 1 && (
                      <button
                        type="button"
                        className="profile-child-action-btn danger"
                        onClick={() => setRemoveConfirmChild(ch)}
                      >
                        Remove Child
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: Church & Classroom Connection ── */}
      {activeTab === 'church' && (
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Church &amp; Sunday School Group</h3>
            </div>
            <div className="profile-data-grid">
              <div className="profile-data-cell">
                <small>Church Community</small>
                <strong>Grace Community Church</strong>
              </div>
              <div className="profile-data-cell">
                <small>Sunday School Circle</small>
                <strong>{connectedClass ? connectedClass.name : 'Wednesday Explorers & Friday Teens'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Teacher Lead</small>
                <strong>{connectedClass ? connectedClass.teacher : 'Teacher Sarah'}</strong>
              </div>
              <div className="profile-data-cell">
                <small>Classroom Code</small>
                <div className="profile-pill-val">{connectedClass ? connectedClass.code : 'EXP-7041'}</div>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-head">
              <h3>Teacher Messaging Permissions</h3>
            </div>
            <div className="profile-data-grid single-col">
              <label className="profile-toggle-row">
                <div className="profile-toggle-info">
                  <strong>Allow direct teacher updates</strong>
                  <small>Teachers can send assignments and pastoral updates to this parent dashboard.</small>
                </div>
                <input
                  type="checkbox"
                  checked={family.teacherMessages}
                  onChange={(e) => onUpdateFamily({ ...family, teacherMessages: e.target.checked })}
                />
                <span className="profile-switch" />
              </label>

              <label className="profile-toggle-row">
                <div className="profile-toggle-info">
                  <strong>Private artwork &amp; reflections</strong>
                  <small>Child drawings and written prayer logs remain private within your family.</small>
                </div>
                <input
                  type="checkbox"
                  checked={family.privateArtwork}
                  onChange={(e) => onUpdateFamily({ ...family, privateArtwork: e.target.checked })}
                />
                <span className="profile-switch" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Security & Privacy (Matching Reference) ── */}
      {activeTab === 'security' && (
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-head-title">
                <svg className="profile-card-head-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <h3>Two-Factor Authentication</h3>
              </div>
            </div>
            <p className="profile-modal-help">Protect your parent dashboard and child access privileges with an extra verification step.</p>
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
                <svg className="profile-card-head-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <h3>Weekly Email Digest</h3>
              </div>
            </div>
            <div className="profile-data-grid single-col">
              <label className="profile-toggle-row">
                <div className="profile-toggle-info">
                  <strong>Weekly Progress Summary</strong>
                  <small>Receive one comprehensive progress digest every Sunday evening with verses mastered.</small>
                </div>
                <input
                  type="checkbox"
                  checked={family.progressEmails}
                  onChange={(e) => onUpdateFamily({ ...family, progressEmails: e.target.checked })}
                />
                <span className="profile-switch" />
              </label>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-head-title">
                <svg className="profile-card-head-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <h3>Active Session</h3>
              </div>
              <span className="profile-status-chip">Current</span>
            </div>
            <div className="profile-data-grid">
              <div className="profile-data-cell">
                <small>Device</small>
                <strong>Current Browser · Desktop</strong>
              </div>
              <div className="profile-data-cell">
                <small>Location</small>
                <strong>Nigeria</strong>
              </div>
              <div className="profile-data-cell full-width">
                <small>Last Active</small>
                <strong>Just now</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Parent Profile ── */}
      {editProfileOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Edit Parent &amp; Family Profile</h3>
              <button type="button" onClick={() => setEditProfileOpen(false)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="profile-modal-body">
                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="editParentName">Parent Full Name</label>
                    <input
                      id="editParentName"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Jordan Adeyemi"
                    />
                  </div>
                  <div className="profile-modal-field">
                    <label htmlFor="editFamilyName">Family Name</label>
                    <input
                      id="editFamilyName"
                      type="text"
                      required
                      value={formFamilyName}
                      onChange={(e) => setFormFamilyName(e.target.value)}
                      placeholder="e.g. The Adeyemi Family"
                    />
                  </div>
                </div>

                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="editParentEmail">Parent Email</label>
                    <input
                      id="editParentEmail"
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. jordan@example.com"
                    />
                  </div>
                  <div className="profile-modal-field">
                    <label htmlFor="editPhoneNumber">Phone Number</label>
                    <input
                      id="editPhoneNumber"
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 349-2810"
                    />
                  </div>
                </div>

                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="editCountry">Country</label>
                    <input
                      id="editCountry"
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="e.g. Nigeria"
                    />
                  </div>
                  <div className="profile-modal-field">
                    <label htmlFor="editHomeAddress">Home Address</label>
                    <input
                      id="editHomeAddress"
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="e.g. 42 Graceful Way, Lagos"
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

      {/* ── MODAL: Change Child PIN / Password (Requested) ── */}
      {editChildPinOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Change Passcode for {editChildPinOpen.name}</h3>
              <button type="button" onClick={() => setEditChildPinOpen(null)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSaveChildPin}>
              <div className="profile-modal-body">
                <p>
                  Set a secret 4-digit PIN or password that {editChildPinOpen.name} will use to enter their space on shared tablets or computers.
                </p>

                {pinError && <div className="profile-modal-error">{pinError}</div>}

                <div className="profile-modal-field">
                  <label htmlFor="newChildPinInput">New 4-Digit PIN or Password</label>
                  <input
                    id="newChildPinInput"
                    type="password"
                    maxLength={12}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="e.g. 2468"
                    autoFocus
                  />
                </div>

                <div className="profile-modal-field">
                  <label htmlFor="confirmChildPinInput">Confirm New PIN</label>
                  <input
                    id="confirmChildPinInput"
                    type="password"
                    maxLength={12}
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repeat new PIN"
                  />
                </div>
              </div>

              <div className="profile-modal-footer">
                <button type="button" onClick={() => setEditChildPinOpen(null)} className="profile-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="profile-btn-primary">
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Child (Requested) ── */}
      {addChildOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Add Child Profile</h3>
              <button type="button" onClick={() => setAddChildOpen(false)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleAddChildSubmit}>
              <div className="profile-modal-body">
                <p>
                  Add a new family member without logging out. They can immediately begin lessons and activities tailored to their age group.
                </p>

                {childError && <div className="profile-modal-error">{childError}</div>}

                <div className="profile-modal-field">
                  <label htmlFor="newChildFirstName">Child First Name</label>
                  <input
                    id="newChildFirstName"
                    type="text"
                    required
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="e.g. David"
                    autoFocus
                  />
                </div>

                <div className="profile-modal-row">
                  <div className="profile-modal-field">
                    <label htmlFor="newChildAgeInput">Age</label>
                    <input
                      id="newChildAgeInput"
                      type="number"
                      min={4}
                      max={17}
                      required
                      value={newChildAge}
                      onChange={(e) => setNewChildAge(e.target.value)}
                    />
                  </div>

                  <div className="profile-modal-field">
                    <label htmlFor="newChildAvatarSelect">Avatar Icon</label>
                    <select id="newChildAvatarSelect" value={newChildAvatar} onChange={(e) => setNewChildAvatar(e.target.value)}>
                      <option value="lion">🦁 Lion</option>
                      <option value="lantern">🏮 Lantern</option>
                      <option value="dove">🕊️ Dove</option>
                      <option value="shield">🛡️ Shield</option>
                    </select>
                  </div>
                </div>

                <div className="profile-modal-field">
                  <label htmlFor="newChildPinInput">Initial Secret PIN (for login)</label>
                  <input
                    id="newChildPinInput"
                    type="password"
                    maxLength={8}
                    required
                    value={newChildPin}
                    onChange={(e) => setNewChildPin(e.target.value)}
                    placeholder="e.g. 1234"
                  />
                </div>
              </div>

              <div className="profile-modal-footer">
                <button type="button" onClick={() => setAddChildOpen(false)} className="profile-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="profile-btn-primary">
                  Create Child Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Remove Child Confirmation (Requested) ── */}
      {removeConfirmChild && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>Remove {removeConfirmChild.name}’s Profile?</h3>
              <button type="button" onClick={() => setRemoveConfirmChild(null)} className="profile-modal-close" aria-label="Close">✕</button>
            </div>
            <div className="profile-modal-body">
              <p>
                Are you sure you want to remove <strong>{removeConfirmChild.name}</strong> from your family? Their completed story badges and verse progress will be archived.
              </p>
            </div>
            <div className="profile-modal-footer">
              <button type="button" onClick={() => setRemoveConfirmChild(null)} className="profile-btn-secondary">
                Keep Profile
              </button>
              <button type="button" onClick={handleRemoveChildConfirm} className="profile-btn-danger">
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
