import Reveal from '../common/Reveal.jsx';

export default function CallToAction() {
  return (
    <div className="end">
      <Reveal as="h2" i={2}>Together, we can stop online fraud.</Reveal>
      <Reveal as="a" className="btn" i={0} href="#top">Check a seller</Reveal>
    </div>
  );
}
