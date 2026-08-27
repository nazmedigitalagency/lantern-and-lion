'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

const demo = { email:'grace@lantern.demo', password:'TeachWithLight24', name:'Grace Okafor' };

export default function TeacherAccessPage() {
  const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [error,setError] = useState(''); const [show,setShow] = useState(false);
  function submit(event: FormEvent) { event.preventDefault(); if (email.trim().toLowerCase() !== demo.email || password !== demo.password) { setError('Those details do not match the teacher demo. Check them and try again.'); return; } localStorage.setItem('lanternLionTeacherSession',JSON.stringify({name:demo.name,email:demo.email})); window.location.href='/teacher-dashboard'; }
  function fillDemo(){setEmail(demo.email);setPassword(demo.password);setError('');}
  return <main className="teacher-access-page"><section className="teacher-access-story"><Link href="/"><Image src="/lantern-lion-logo.png" alt="" width={64} height={64}/><span><strong>Lantern &amp; Lion</strong><small>Teacher space</small></span></Link><div><p className="teacher-kicker">A calm classroom view</p><h1>Teach the story. See who needs you.</h1><p>Assign thoughtful Bible activities, notice progress and speak with parents without opening private child messages.</p><ul><li><span>01</span> One clear view across every class</li><li><span>02</span> Join codes controlled by the teacher</li><li><span>03</span> Parent-safe messages and help flags</li></ul></div></section><section className="teacher-access-form"><div><p className="teacher-kicker">Teacher demo</p><h2>Welcome back.</h2><p>Use the demo details below to explore the classroom platform.</p><div className="teacher-demo"><span><b>Email</b>{demo.email}</span><span><b>Password</b>{demo.password}</span><button onClick={fillDemo}>Use demo details</button></div><form onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(e)=>{setEmail(e.target.value);setError('');}}/></label><label>Password<div><input type={show?'text':'password'} autoComplete="current-password" value={password} onChange={(e)=>{setPassword(e.target.value);setError('');}}/><button type="button" onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div></label>{error&&<p className="teacher-access-error" role="alert">{error}</p>}<button className="button button-primary">Open teacher dashboard</button></form><small>Demo only. Real school verification and Google sign-in will be added with production authentication.</small></div></section></main>;
}
