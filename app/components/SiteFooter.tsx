import Image from 'next/image';
import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-brand">
        <Image src="/lantern-lion-logo.png" alt="" width={76} height={76} />
        <div>
          <strong>Lantern &amp; Lion</strong>
          <p>Bible play for growing minds.</p>
        </div>
      </div>
      <div>
        <b>Explore</b>
        <Link href="/curriculum">Curriculum</Link>
        <Link href="/learn">All 37+ lessons</Link>
        <Link href="/multiplayer">Team games</Link>
        <Link href="/churches">Churches &amp; Classrooms</Link>
        <Link href="/blog">Blog</Link>
      </div>
      <div>
        <b>Sign in</b>
        <Link href="/child-access">Child sign in</Link>
        <Link href="/teen-access">Teen sign in</Link>
        <Link href="/parent-access">Parent sign in</Link>
        <Link href="/teacher-access">Teacher sign in</Link>
      </div>
      <div>
        <b>Safety &amp; Trust</b>
        <Link href="/safety">Family safety promises</Link>
        <Link href="/about">Our Faith &amp; Mission</Link>
        <Link href="/parent-access">Create family account</Link>
      </div>
      <p className="copyright">© 2026 Lantern &amp; Lion. Built with care for families.</p>
    </footer>
  );
}
