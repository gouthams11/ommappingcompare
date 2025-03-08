function parseXML(xmlString) {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
}

function extractMappings(xmlDoc) {
    const mappings = [];
    const receivers = xmlDoc.getElementsByTagName("ReceiverInterfaceRule");

    for (let receiver of receivers) {
        let component = receiver.parentElement.getElementsByTagName("ComponentID")[0]?.textContent || "Unknown";
        let operation = receiver.getElementsByTagName("Operation")[0]?.textContent || "Unknown";

        let conditions = [];
        let conditionBlocks = receiver.getElementsByTagName("AtomicCondition");
        for (let cond of conditionBlocks) {
            let leftPath = cond.getElementsByTagName("LeftExtractor")[0]?.getElementsByTagName("Value")[0]?.textContent || "";
            let operator = cond.getElementsByTagName("Operator")[0]?.textContent || "";
            let rightValue = cond.getElementsByTagName("RightExtractor")[0]?.getElementsByTagName("Value")[0]?.textContent || "";

            // Handling different operators
            let operatorSymbol = getOperatorSymbol(operator);

            conditions.push(`${leftPath} ${operatorSymbol} ${rightValue}`);
        }

        let mappingName = receiver.getElementsByTagName("Mapping")[0]?.getElementsByTagName("Name")[0]?.textContent || "Unknown";

        mappings.push({
            component, 
            operation, 
            condition: conditions.join(" "), // Ensure proper joining
            om: mappingName
        });
    }
    return mappings;
}

// Function to map operators to readable symbols
function getOperatorSymbol(operator) {
    const operators = {
        "EQ": "=",  // Equal
        "NE": "≠",  // Not Equal
        "LT": "<",  // Less Than
        "GT": ">",  // Greater Than
        "LE": "≤",  // Less Than or Equal
        "GE": "≥",  // Greater Than or Equal
        "AND": "AND",
        "OR": "OR"
    };
    return operators[operator] || operator; // Default to operator if not found
}

function compareXML() {
    let devXml = document.getElementById("devXml").value;
    let prodXml = document.getElementById("prodXml").value;
    if (!devXml || !prodXml) {
        alert("Please paste both Dev and Prod XMLs!");
        return;
    }

    let devMappings = extractMappings(parseXML(devXml));
    let prodMappings = extractMappings(parseXML(prodXml));

    let outputHtml = `
        <table>
            <tr>
                <th rowspan="2">Component</th>
                <th colspan="2" class="sub-header">Dev</th>
                <th colspan="2" class="sub-header">Prod</th>
            </tr>
            <tr>
                <th>Condition</th>
                <th>OM</th>
                <th>Condition</th>
                <th>OM</th>
            </tr>`;

    let allComponents = [...new Set([...devMappings.map(d => d.component), ...prodMappings.map(p => p.component)])];

    allComponents.forEach(component => {
        let devEntries = devMappings.filter(d => d.component === component);
        let prodEntries = prodMappings.filter(p => p.component === component);
        let maxRows = Math.max(devEntries.length, prodEntries.length);

        for (let i = 0; i < maxRows; i++) {
            let devData = devEntries[i] || { condition: "", om: "" };
            let prodData = prodEntries[i] || { condition: "", om: "" };

            let highlightClass = devData.condition !== prodData.condition ? "highlight" : "";

            outputHtml += `
                <tr class="${highlightClass}">
                    ${i === 0 ? `<td rowspan="${maxRows}">${component}</td>` : ""}
                    <td>${devData.condition}</td>
                    <td>${devData.om}</td>
                    <td>${prodData.condition}</td>
                    <td>${prodData.om}</td>
                </tr>`;
        }
    });

    outputHtml += "</table>";
    document.getElementById("output").innerHTML = outputHtml;
}
