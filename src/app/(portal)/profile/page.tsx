import { requirePartner } from "@/lib/auth";
import { ProfileContent } from "@/components/profile/profile-content";

export default async function ProfilePage() {
  const partner = await requirePartner();

  return (
    <ProfileContent
      partner={{
        firstName: partner.firstName,
        lastName: partner.lastName,
        email: partner.email,
        companyName: partner.companyName,
        phone: partner.phone,
        address: partner.address,
        city: partner.city,
        state: partner.state,
        zip: partner.zip,
        contractorLicense: partner.contractorLicense,
        warehouseAddress: partner.warehouseAddress,
        warehouseCity: partner.warehouseCity,
        warehouseState: partner.warehouseState,
        warehouseZip: partner.warehouseZip,
        warehouseSameAsBusiness: partner.warehouseSameAsBusiness,
        tier: partner.tier,
        certifiedAt: partner.certifiedAt?.toISOString() ?? null,
        certExpiresAt: partner.certExpiresAt?.toISOString() ?? null,
        insuranceExpiry: partner.insuranceExpiry?.toISOString() ?? null,
      }}
    />
  );
}
