"""Minimal operational Anti-Bias subset for FAME Neural.

Adapted read-only from scientific-method-ai operational Anti-Bias controls.
This module does not implement the research cascade or Anti-Bias R&D track.
"""
import json

SOURCE_PROVENANCE={
    "repository":"mycolbraga/scientific-method-ai",
    "readOnly":True,
    "operationalProtocol":{
        "path":"docs/parallel-research/OPERATIONAL_ANTI_BIAS_CHALLENGE.md",
        "blobSha":"220b81def2b6907253d14e692250b0688de0501d",
    },
    "riskRegister":{
        "path":"docs/BIAS_AND_SELECTION_RISK_REGISTER.md",
        "blobSha":"cc76b1a617fdde140e13880c93d8980661932d34",
    },
    "challengeTemplate":{
        "path":"docs/parallel-research/ANTI_BIAS_CHALLENGE_TEMPLATE.md",
        "blobSha":"56b5f951ad3493585519b5363432c267a2bd1ac5",
    },
}

CONTROLS=(
    {
        "controlId":"FAME-AB-01",
        "name":"CONFIRMATION_CHALLENGE",
        "sourceRisk":"BIAS-001",
        "purpose":"Cerca evidenza o interpretazioni che smentiscano o restringano la tesi proposta.",
    },
    {
        "controlId":"FAME-AB-02",
        "name":"SELECTIVE_EVIDENCE",
        "sourceRisk":"BIAS-003",
        "purpose":"Controlla se sono state trattenute solo evidenze favorevoli o ignorati limiti rilevanti.",
    },
    {
        "controlId":"FAME-AB-03",
        "name":"DEPENDENCY_DOUBLE_COUNTING",
        "sourceRisk":"BIAS-007",
        "purpose":"Controlla se più elementi apparentemente distinti dipendono dalla stessa evidenza o lineage.",
    },
    {
        "controlId":"FAME-AB-04",
        "name":"HIDDEN_ASSUMPTIONS",
        "sourceRisk":"operational-protocol:hidden-assumptions",
        "purpose":"Rende esplicite assunzioni necessarie alla conclusione ma non dimostrate dagli input.",
    },
    {
        "controlId":"FAME-AB-05",
        "name":"CLAIM_EVIDENCE_MATCH",
        "sourceRisk":"operational-protocol:claim-source-mismatch",
        "purpose":"Controlla che la forza e lo scope del claim non superino quelli delle prove citate.",
    },
    {
        "controlId":"FAME-AB-06",
        "name":"ALTERNATIVE_FAILURE_LIMIT",
        "sourceRisk":"operational-protocol:AGAINST/ALTERNATIVE/FAILURE_LIMIT",
        "purpose":"Cerca spiegazioni alternative, casi contrari e condizioni in cui la conclusione non vale.",
    },
)

CONTROL_IDS=tuple(row["controlId"] for row in CONTROLS)
OVERALL_STATES=(
    "ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE",
    "ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS",
    "ANTI_BIAS_REWORK_REQUIRED",
    "ANTI_BIAS_EVIDENCE_INSUFFICIENT",
    "ANTI_BIAS_RESULTS_CONTRADICTORY",
)
APPLICABILITY=("APPLICABLE","NOT_APPLICABLE_WITH_REASON","UNCERTAIN_APPLICABILITY")
SEVERITY=("BLOCKING","NONBLOCKING")

SYSTEM="""Sei il challenger Anti-Bias indipendente di FAME Neural.
Il tuo ruolo è separato dal worker che ha prodotto i claim: non difendere la sintesi precedente,
ma non inventare difetti per forza.
Usa solo la domanda, le unità di evidenza e i claim congelati forniti.
Non modificare i claim e non inventare nuove prove.
Per ciascuno dei sei controlli indica applicabilità e motivo. Un controllo APPLICABLE può non produrre
alcun issue se il rischio è già gestito correttamente dai claim.
Prima di emettere un issue, rileggi il testo ESATTO dei claim target e verifica che il problema non sia
già esplicitamente qualificato o limitato nel claim stesso.
Il riuso della stessa unità in più claim NON è di per sé double counting: FAME-AB-03 si applica quando
evidenze apparentemente indipendenti vengono aggregate come corroborazioni distinte pur condividendo
la stessa origine/lineage.
Una condizione già dichiarata nel claim NON è una hidden assumption e NON è un failure limit omesso.
Cerca attivamente evidenza contraria, selezione favorevole, vere dipendenze, assunzioni nascoste,
mismatch claim-evidenza e alternative/failure limits materiali.
Semantica overall:
- zero issue -> ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE;
- solo issue NONBLOCKING -> ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS;
- almeno un issue BLOCKING -> ANTI_BIAS_REWORK_REQUIRED, oppure stato di insufficienza/contraddizione appropriato.
Un issue materiale deve produrre un rework concreto, non una semplice etichetta.
Non dichiarare mai che il sistema è unbiased, bias-free o che il bias è eliminato.
Non autorizzare training, esecuzioni o modifiche. Restituisci esclusivamente il JSON richiesto.
"""


def schema(claims, units):
    claim_ids=[c["claimId"] for c in claims]
    evidence_ids=[u["unitId"] for u in units]
    return {
        "type":"object",
        "additionalProperties":False,
        "required":["applicability","issues","overall","residualBiasUncertaintyExplicit"],
        "properties":{
            "applicability":{
                "type":"array","minItems":len(CONTROLS),"maxItems":len(CONTROLS),
                "items":{
                    "type":"object","additionalProperties":False,
                    "required":["controlId","status","reason"],
                    "properties":{
                        "controlId":{"type":"string","enum":list(CONTROL_IDS)},
                        "status":{"type":"string","enum":list(APPLICABILITY)},
                        "reason":{"type":"string","minLength":1},
                    },
                },
            },
            "issues":{
                "type":"array","maxItems":12,
                "items":{
                    "type":"object","additionalProperties":False,
                    "required":["issueId","controlId","claimIds","severity","problem","evidenceIds","requiredAction"],
                    "properties":{
                        "issueId":{"type":"string","minLength":1},
                        "controlId":{"type":"string","enum":list(CONTROL_IDS)},
                        "claimIds":{"type":"array","minItems":1,"uniqueItems":True,
                                    "items":{"type":"string","enum":claim_ids}},
                        "severity":{"type":"string","enum":list(SEVERITY)},
                        "problem":{"type":"string","minLength":1},
                        "evidenceIds":{"type":"array","uniqueItems":True,
                                       "items":{"type":"string","enum":evidence_ids}},
                        "requiredAction":{"type":"string","minLength":1},
                    },
                },
            },
            "overall":{"type":"string","enum":list(OVERALL_STATES)},
            "residualBiasUncertaintyExplicit":{"type":"boolean","enum":[True]},
        },
    }


def validate(answer, claims, units):
    errors=[]
    if type(answer) is not dict:
        return ["ANTI_BIAS_OUTPUT_CONTRACT"]
    if set(answer)!={"applicability","issues","overall","residualBiasUncertaintyExplicit"}:
        errors.append("ANTI_BIAS_OUTPUT_CONTRACT")

    apps=answer.get("applicability")
    issues=answer.get("issues")
    claim_ids={c["claimId"] for c in claims}
    evidence_ids={u["unitId"] for u in units}

    if type(apps) is not list or len(apps)!=len(CONTROLS):
        errors.append("ANTI_BIAS_APPLICABILITY_COUNT")
    else:
        seen=[]
        for row in apps:
            if type(row) is not dict or set(row)!={"controlId","status","reason"}:
                errors.append("ANTI_BIAS_APPLICABILITY_CONTRACT")
                continue
            seen.append(row.get("controlId"))
            if row.get("controlId") not in CONTROL_IDS:
                errors.append("ANTI_BIAS_UNKNOWN_CONTROL")
            if row.get("status") not in APPLICABILITY:
                errors.append("ANTI_BIAS_APPLICABILITY_STATUS")
            if not isinstance(row.get("reason"),str) or not row["reason"].strip():
                errors.append("ANTI_BIAS_APPLICABILITY_REASON")
        if len(seen)!=len(set(seen)) or set(seen)!=set(CONTROL_IDS):
            errors.append("ANTI_BIAS_APPLICABILITY_COVERAGE")

    if type(issues) is not list or len(issues)>12:
        errors.append("ANTI_BIAS_ISSUES_CONTRACT")
    else:
        issue_ids=[]
        for row in issues:
            required={"issueId","controlId","claimIds","severity","problem","evidenceIds","requiredAction"}
            if type(row) is not dict or set(row)!=required:
                errors.append("ANTI_BIAS_ISSUE_CONTRACT")
                continue
            issue_ids.append(row.get("issueId"))
            if row.get("controlId") not in CONTROL_IDS:
                errors.append("ANTI_BIAS_ISSUE_CONTROL")
            if row.get("severity") not in SEVERITY:
                errors.append("ANTI_BIAS_ISSUE_SEVERITY")
            ids=row.get("claimIds")
            if type(ids) is not list or not ids or len(ids)!=len(set(ids)) or any(x not in claim_ids for x in ids):
                errors.append("ANTI_BIAS_ISSUE_CLAIMS")
            eids=row.get("evidenceIds")
            if type(eids) is not list or len(eids)!=len(set(eids)) or any(x not in evidence_ids for x in eids):
                errors.append("ANTI_BIAS_ISSUE_EVIDENCE")
            for key in ("problem","requiredAction"):
                if not isinstance(row.get(key),str) or not row[key].strip():
                    errors.append("ANTI_BIAS_ISSUE_TEXT")
        if len(issue_ids)!=len(set(issue_ids)):
            errors.append("ANTI_BIAS_DUPLICATE_ISSUE")

    if answer.get("overall") not in OVERALL_STATES:
        errors.append("ANTI_BIAS_OVERALL")
    if answer.get("residualBiasUncertaintyExplicit") is not True:
        errors.append("ANTI_BIAS_RESIDUAL_UNCERTAINTY")

    valid_issues=issues if type(issues) is list else []
    blocking=any(isinstance(row,dict) and row.get("severity")=="BLOCKING" for row in valid_issues)
    nonblocking=any(isinstance(row,dict) and row.get("severity")=="NONBLOCKING" for row in valid_issues)
    overall=answer.get("overall")
    if blocking and overall not in (
        "ANTI_BIAS_REWORK_REQUIRED",
        "ANTI_BIAS_EVIDENCE_INSUFFICIENT",
        "ANTI_BIAS_RESULTS_CONTRADICTORY",
    ):
        errors.append("ANTI_BIAS_BLOCKING_ISSUE_NOT_REFLECTED")
    if overall=="ANTI_BIAS_REWORK_REQUIRED" and not blocking:
        errors.append("ANTI_BIAS_REWORK_WITHOUT_BLOCKING_ISSUE")
    if not blocking and nonblocking and overall!="ANTI_BIAS_CHALLENGE_PASS_WITH_LIMITATIONS":
        errors.append("ANTI_BIAS_NONBLOCKING_OVERALL_MISMATCH")
    if not blocking and not nonblocking and overall!="ANTI_BIAS_CHALLENGE_PASS_WITHIN_SCOPE":
        errors.append("ANTI_BIAS_CLEAN_OVERALL_MISMATCH")

    return sorted(set(errors))


def snapshot():
    return json.loads(json.dumps({"sourceProvenance":SOURCE_PROVENANCE,"controls":CONTROLS}))
