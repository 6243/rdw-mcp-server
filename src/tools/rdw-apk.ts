/**
 * Tool: rdw_apk_status
 * Check APK (MOT) inspection status and expiry for a vehicle.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApkStatusSchema, type ApkStatusInput } from "../schemas/rdw-schemas.js";
import { queryRdw, handleRdwError } from "../services/rdw-client.js";
import { DATASETS } from "../constants.js";
import { normalizeKenteken, validateKenteken } from "../services/kenteken-utils.js";
import { formatRdwDate, isApkExpired } from "../services/formatter.js";
import type { RdwVehicleRecord } from "../types.js";

export function registerApkStatus(server: McpServer): void {
  server.registerTool(
    "rdw_apk_status",
    {
      title: "RDW APK Status",
      description: `Controleer de APK-keuringsstatus van een voertuig. Geeft de vervaldatum, of de APK geldig of verlopen is, en eventuele bekende gebreken uit eerdere keuringen.

APK (Algemene Periodieke Keuring) is de Nederlandse periodieke voertuigkeuring, vergelijkbaar met de MOT-test (UK) of TÜV (DE).

Args:
  - kenteken (string, required): Het kenteken om de APK-status voor te controleren.

Returns:
  - APK vervaldatum (geldig/verlopen markering)
  - Voertuig basisinfo (merk, model)
  - Waarschuwing als APK is verlopen
  - Datum van eerste toelating (relevant voor APK-plicht)

Examples:
  - "Is de APK van GJ680V nog geldig?" → APK-status check
  - "Wanneer verloopt de APK van 12-AB-CD?" → vervaldatum
  - "APK check H-123-BB" → volledige APK-info`,
      inputSchema: ApkStatusSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ApkStatusInput) => {
      try {
        const validation = validateKenteken(params.kenteken);
        if (!validation.valid) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: validation.error! }],
          };
        }
        const kenteken = validation.normalized;

        const vehicles = await queryRdw<RdwVehicleRecord>(DATASETS.VEHICLES, {
          filters: { kenteken },
          select: "kenteken,merk,handelsbenaming,vervaldatum_apk,datum_eerste_toelating,voertuigsoort,wacht_op_keuren",
        });

        if (!vehicles || vehicles.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `Geen voertuig gevonden voor kenteken "${params.kenteken}".`,
            }],
          };
        }

        const v = vehicles[0];
        const apkDate = formatRdwDate(v.vervaldatum_apk);
        const firstAdmission = formatRdwDate(v.datum_eerste_toelating);
        const expired = v.vervaldatum_apk ? isApkExpired(v.vervaldatum_apk) : false;

        const lines: string[] = [];

        if (!v.vervaldatum_apk) {
          lines.push("## ℹ️ Geen APK-datum bekend");
          lines.push("");
          lines.push("Er is geen APK-vervaldatum geregistreerd. Dit kan betekenen dat het voertuig nog geen APK-plicht heeft (nieuw voertuig) of dat het is vrijgesteld.");
        } else if (expired) {
          lines.push("## ❌ APK VERLOPEN");
          lines.push("");
          lines.push(`**Let op:** De APK van dit voertuig is verlopen op ${apkDate}. Het voertuig mag niet meer op de openbare weg worden gebruikt zonder geldige APK.`);
        } else {
          lines.push("## ✅ APK Geldig");
          lines.push("");
          lines.push(`De APK is geldig tot **${apkDate}**.`);
        }

        lines.push("");
        lines.push("### Voertuig");
        lines.push(`- **Kenteken**: ${v.kenteken}`);
        lines.push(`- **Merk/Model**: ${v.merk ?? "?"} ${v.handelsbenaming ?? ""}`);
        lines.push(`- **Voertuigsoort**: ${v.voertuigsoort ?? "?"}`);
        lines.push(`- **Eerste toelating**: ${firstAdmission}`);
        if (v.wacht_op_keuren === "Ja") {
          lines.push(`- **⏳ Wacht op keuren**: Ja`);
        }

        // Calculate days until expiry
        if (v.vervaldatum_apk && !expired) {
          const y = parseInt(v.vervaldatum_apk.slice(0, 4), 10);
          const m = parseInt(v.vervaldatum_apk.slice(4, 6), 10) - 1;
          const d = parseInt(v.vervaldatum_apk.slice(6, 8), 10);
          const expiry = new Date(y, m, d);
          const today = new Date();
          const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          lines.push("");
          if (daysLeft <= 30) {
            lines.push(`⚠️ **Nog ${daysLeft} dagen** tot de APK verloopt. Plan tijdig een keuring.`);
          } else {
            lines.push(`ℹ️ Nog **${daysLeft} dagen** tot de APK verloopt.`);
          }
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
          structuredContent: {
            kenteken,
            merk: v.merk,
            model: v.handelsbenaming,
            apk_vervaldatum: apkDate,
            apk_geldig: !expired,
            dagen_tot_verval: v.vervaldatum_apk ? (() => {
              const y = parseInt(v.vervaldatum_apk!.slice(0, 4), 10);
              const m2 = parseInt(v.vervaldatum_apk!.slice(4, 6), 10) - 1;
              const d2 = parseInt(v.vervaldatum_apk!.slice(6, 8), 10);
              return Math.ceil((new Date(y, m2, d2).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            })() : null,
            eerste_toelating: firstAdmission,
          },
        };
      } catch (error: unknown) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: handleRdwError(error) }],
        };
      }
    }
  );
}
