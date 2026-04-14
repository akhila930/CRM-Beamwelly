import { useNavigate, useParams } from "react-router-dom";
import { UpdateCandidateForm } from "@/components/recruitment/UpdateCandidateForm";

export const EditCandidate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <div>Invalid candidate ID</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Candidate</h1>
      <UpdateCandidateForm
        candidateId={parseInt(id)}
        onSuccess={() => navigate("/recruitment")}
        onCancel={() => navigate("/recruitment")}
      />
    </div>
  );
};
