import { Heading, Link } from 'react-aria-components'

export function About() {
  return (
    <section
      className="mx-auto my-8 flex max-w-xl flex-col items-center justify-center
        p-8 text-offroad-text"
    >
      <Heading level={1} className="mb-4 text-3xl font-medium">
        About Offroad Package Delivery
      </Heading>
      <p className="mb-6 text-base leading-relaxed">
        You are stuck in the jungle and you need new stationary, or you are in
        the desert and you need new shoes.
      </p>
      <p className="mb-6 text-base leading-relaxed">
        Normally you'd be in..... TROUBLE!!!!
      </p>
      <p className="mb-6 text-base leading-relaxed">
        But fear not, Offroad Package Delivery is here to save the day!
      </p>
      <Link
        href="/"
        className="rounded font-medium text-offroad-primary underline
          outline-none hover:no-underline focus-visible:ring-2
          focus-visible:ring-black focus-visible:ring-offset-2"
      >
        Back to Home
      </Link>
    </section>
  )
}
