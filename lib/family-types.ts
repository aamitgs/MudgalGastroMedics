export type FamilyRelation = "Spouse" | "Child" | "Parent" | "Sibling" | "Other";

export type FamilyMember = {
  id: string;
  createdAt: string;
  ownerPhone: string;
  name: string;
  relation: FamilyRelation;
  age?: string;
  phone?: string;
  notes?: string;
};

export const familyRelations: FamilyRelation[] = ["Spouse", "Child", "Parent", "Sibling", "Other"];
