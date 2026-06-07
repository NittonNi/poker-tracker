import { PageHeader } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { FeedbackForm } from "@/components/feedback-form";

export default function FeedbackPage() {
  return (
    <div className="space-y-5">
      <div>
        <BackLink href="/grupos" label="Volver" />
        <PageHeader
          title="Feedback"
          subtitle="¿Una idea, un fallo, algo que mejorar? Cuéntanoslo."
        />
      </div>
      <FeedbackForm />
    </div>
  );
}
