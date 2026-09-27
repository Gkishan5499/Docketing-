import React, { useState } from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { X, Users, FolderOpen } from 'lucide-react';

export const AddClientModal: React.FC = () => {
  const { modalState, closeModal, addClient, showToast } = useLawyersDiary();

  const isOpen = modalState.type === 'add-client';

  const [name, setName] = useState('');
  const [type, setType] = useState('Company');
  const [country, setCountry] = useState('India');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [attorney, setAttorney] = useState('Self');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Client / Company name is required', 'er');
      return;
    }
    addClient({
      name: name.trim(),
      type,
      country,
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      attorney,
    });
  };

  return (
    <div className="ov op" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="mo sm">
        <div className="mh">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-slate-800" />
            <h3 className="m-0 text-[1.2rem]">Enroll Retained Client</h3>
          </div>
          <button className="mc" onClick={closeModal} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb">
          <form onSubmit={handleSubmit}>
            <div className="fg">
              <div className="fgp sp">
                <label className="fl">
                  Client Legal Entity Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajan & Sons Pvt. Ltd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="fgp">
                <label className="fl">Entity Classification</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Individual</option>
                  <option>Company</option>
                  <option>LLP</option>
                  <option>Partnership</option>
                  <option>Trust</option>
                  <option>Statutory Body</option>
                  <option>Government</option>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">Jurisdiction / Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option>India</option>
                  <option>USA</option>
                  <option>UK</option>
                  <option>UAE</option>
                  <option>Germany</option>
                  <option>Japan</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="fgp">
                <label className="fl">Primary Contact Person</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="fgp">
                <label className="fl">Official Email</label>
                <input
                  type="email"
                  placeholder="counsel@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="fgp">
                <label className="fl">Direct Telephone</label>
                <input
                  type="tel"
                  placeholder="+91 98100 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="fgp sp">
                <label className="fl">Responsible Lead Partner</label>
                <select value={attorney} onChange={(e) => setAttorney(e.target.value)}>
                  <option>Self</option>
                  <option>Senior Advocate</option>
                  <option>Associate Counsel</option>
                  <option>Junior Advocate</option>
                  <option>Clerk</option>
                </select>
              </div>

              <div className="ib pr sp flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-slate-700 shrink-0" />
                <span>
                  Automated Document Vault hierarchy with sub-vaults for IPR and Court Matters will be initialized.
                </span>
              </div>
            </div>
          </form>
        </div>

        <div className="mf">
          <button type="button" className="btn btn-o" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="btn btn-p" onClick={handleSubmit}>
            Create Client &amp; Provision Vault
          </button>
        </div>
      </div>
    </div>
  );
};
