import * as sql from "mssql";
import { poolPromise } from "../config/db";

export const replaceVetServices = async (
  vetId: string,
  services: string[]
) => {
  const pool = await poolPromise;

  await pool.request()
    .input("vet_id", sql.VarChar(100), vetId)
    .query("DELETE FROM VetServices WHERE vet_id = @vet_id");

  for (const service_id of services) {
    await pool.request()
      .input("vet_id", sql.VarChar(100), vetId)
      .input("service_id", sql.VarChar(100), service_id)
      .query(`
        INSERT INTO VetServices (vet_id, service_id)
        VALUES (@vet_id, @service_id)
      `);
  }
};

export const getAllVetsWithServices = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.phone,
      vp.clinic_name,
      vp.address,
      vp.city,
      vp.state,
      STUFF((
        SELECT ',' + s.name
        FROM VetServices vs
        INNER JOIN Services s 
          ON vs.service_id = s.service_id
        WHERE vs.vet_id = u.user_id
        FOR XML PATH(''), TYPE
      ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS services
    FROM Users u
    LEFT JOIN VetProfiles vp 
      ON u.user_id = vp.vet_id
    WHERE u.role = 'vet'
  `);

  return result.recordset.map(vet => ({
    ...vet,
    services: vet.services ? vet.services.split(",") : []
  }));
};
