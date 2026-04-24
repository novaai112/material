export const generateAnsysXML = (material: any) => {
  // Helpers to repeat strings
  const repeatDependent = (count: number) => Array(count).fill("Dependent").join(",");
  const repeatIndependent = (count: number) => Array(count).fill("Independent").join(",");

  const name = material.Name || "Material";

  // Density
  let densityVal = 7850; // Default
  if (material.Properties?.Density?.Value) {
    densityVal = material.Properties.Density.Value;
  } else if (material.BaseInformation?.Density?.Value) {
    densityVal = material.BaseInformation.Density.Value;
  } else if (material.Density?.Value) {
    densityVal = material.Density.Value;
  }

  // Elasticity
  let eData = "";
  let prData = "";
  let kData = "";
  let gData = "";
  let tDataElastic = "";
  let countElastic = 0;

  const elasticity = material.IsotropicElasticity || material.Properties?.IsotropicElasticity;
  if (elasticity && elasticity.Temperature?.Values?.length > 0 && elasticity.YoungsModulus?.Values?.length > 0 && elasticity.PoissonsRatio?.Values?.length > 0) {
    const tVals = elasticity.Temperature.Values;
    const eVals = elasticity.YoungsModulus.Values;
    const prVals = elasticity.PoissonsRatio.Values;
    countElastic = tVals.length;

    // Convert GPa to Pa if necessary
    const eScale = elasticity.YoungsModulus.Unit.includes("GPa") ? 1e9 : 
                   (elasticity.YoungsModulus.Unit.includes("MPa") ? 1e6 : 1);

    const calcK = (E: number, v: number) => E / (3 * (1 - 2 * v));
    const calcG = (E: number, v: number) => E / (2 * (1 + v));

    const eArr = eVals.map((v: number) => v * eScale);
    const prArr = prVals;
    const kArr = eVals.map((v: number, i: number) => calcK(v * eScale, prVals[i]));
    const gArr = eVals.map((v: number, i: number) => calcG(v * eScale, prVals[i]));

    tDataElastic = tVals.join(",");
    eData = eArr.join(",");
    prData = prArr.join(",");
    kData = kArr.join(",");
    gData = gArr.join(",");
  }

  // CTE
  let cteData = "";
  let tDataCte = "";
  let countCte = 0;
  const cte = material.ThermalExpansion || material.CoefficientOfThermalExpansion || material.Properties?.CoefficientOfThermalExpansion;
  if (cte && cte.Temperature?.Values?.length > 0 && cte.CTE?.Values?.length > 0) {
    tDataCte = cte.Temperature.Values.join(",");
    // Need to handle unit conversion if needed, but keeping as is based on example
    cteData = cte.CTE.Values.join(",");
    countCte = cte.Temperature.Values.length;
  }

  // Thermal Conductivity
  let tcData = "";
  let tDataTc = "";
  let countTc = 0;
  const tc = material.ThermalConductivity || material.Properties?.ThermalConductivity;
  if (tc && tc.Temperature?.Values?.length > 0 && tc.Conductivity?.Values?.length > 0) {
    tDataTc = tc.Temperature.Values.join(",");
    tcData = tc.Conductivity.Values.join(",");
    countTc = tc.Temperature.Values.length;
  }

  // Specific Heat
  let shData = "";
  let tDataSh = "";
  let countSh = 0;
  const sh = material.SpecificHeat || material.Properties?.SpecificHeat;
  if (sh && sh.Temperature?.Values?.length > 0 && sh.SpecificHeat?.Values?.length > 0) {
    tDataSh = sh.Temperature.Values.join(",");
    shData = sh.SpecificHeat.Values.join(",");
    countSh = sh.Temperature.Values.length;
  }



  const xml = `<EngineeringData version="22.1.0.0" versiondate="11/28/2022 8:19:00 AM">
<Notes> </Notes>
<Materials>
<MatML_Doc>
<Material>
<BulkDetails>
<Name>${name}</Name>
<PropertyData property="pr0">
<Data format="string">-</Data>
<ParameterValue parameter="pa0" format="float">
<Data>155</Data>
<Qualifier name="Variable Type">Dependent</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa1" format="float">
<Data>244</Data>
<Qualifier name="Variable Type">Dependent</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa2" format="float">
<Data>255</Data>
<Qualifier name="Variable Type">Dependent</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa3" format="string">
<Data>Appearance</Data>
</ParameterValue>
</PropertyData>
<PropertyData property="pr1">
<Data format="string">-</Data>
<Qualifier name="Field Variable Compatible">Temperature</Qualifier>
<ParameterValue parameter="pa4" format="string">
<Data>Interpolation Options</Data>
<Qualifier name="AlgorithmType">Linear Multivariate</Qualifier>
<Qualifier name="Normalized">True</Qualifier>
<Qualifier name="Cached">True</Qualifier>
<Qualifier name="ExtrapolationType">Projection to the Bounding Box</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa5" format="float">
<Data>${densityVal}</Data>
<Qualifier name="Variable Type">Dependent</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa6" format="float">
<Data>22</Data>
<Qualifier name="Variable Type">Independent</Qualifier>
<Qualifier name="Field Variable">Temperature</Qualifier>
<Qualifier name="Default Data">22</Qualifier>
<Qualifier name="Field Units">C</Qualifier>
<Qualifier name="Upper Limit">Program Controlled</Qualifier>
<Qualifier name="Lower Limit">Program Controlled</Qualifier>
</ParameterValue>
</PropertyData>
${countElastic > 0 ? `
<PropertyData property="pr2">
<Data format="string">-</Data>
<Qualifier name="Behavior">Isotropic</Qualifier>
<Qualifier name="Derive from">Young's Modulus and Poisson's Ratio</Qualifier>
<Qualifier name="Field Variable Compatible">Temperature</Qualifier>
<ParameterValue parameter="pa4" format="string">
<Data>Interpolation Options</Data>
<Qualifier name="AlgorithmType">Linear Multivariate</Qualifier>
<Qualifier name="Normalized">True</Qualifier>
<Qualifier name="Cached">True</Qualifier>
<Qualifier name="ExtrapolationType">Projection to the Bounding Box</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa7" format="float">
<Data>${eData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countElastic)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa8" format="float">
<Data>${prData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countElastic)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa9" format="float">
<Data>${kData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countElastic)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa10" format="float">
<Data>${gData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countElastic)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa6" format="float">
<Data>${tDataElastic}</Data>
<Qualifier name="Variable Type">${repeatIndependent(countElastic)}</Qualifier>
<Qualifier name="Field Variable">Temperature</Qualifier>
<Qualifier name="Default Data">22</Qualifier>
<Qualifier name="Field Units">C</Qualifier>
<Qualifier name="Upper Limit">Program Controlled</Qualifier>
<Qualifier name="Lower Limit">Program Controlled</Qualifier>
</ParameterValue>
</PropertyData>
` : ""}
${countCte > 0 ? `
<PropertyData property="pr3">
<Data format="string">-</Data>
<Qualifier name="Definition">Instantaneous</Qualifier>
<Qualifier name="Behavior">Isotropic</Qualifier>
<ParameterValue parameter="pa11" format="float">
<Data>${cteData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countCte)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa6" format="float">
<Data>${tDataCte}</Data>
<Qualifier name="Variable Type">${repeatIndependent(countCte)}</Qualifier>
</ParameterValue>
</PropertyData>
` : ""}
${countTc > 0 ? `
<PropertyData property="pr4">
<Data format="string">-</Data>
<Qualifier name="Behavior">Isotropic</Qualifier>
<Qualifier name="Field Variable Compatible">Temperature</Qualifier>
<ParameterValue parameter="pa4" format="string">
<Data>Interpolation Options</Data>
<Qualifier name="AlgorithmType">Linear Multivariate</Qualifier>
<Qualifier name="Normalized">True</Qualifier>
<Qualifier name="Cached">True</Qualifier>
<Qualifier name="ExtrapolationType">Projection to the Bounding Box</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa12" format="float">
<Data>${tcData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countTc)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa6" format="float">
<Data>${tDataTc}</Data>
<Qualifier name="Variable Type">${repeatIndependent(countTc)}</Qualifier>
<Qualifier name="Field Variable">Temperature</Qualifier>
<Qualifier name="Default Data">22</Qualifier>
<Qualifier name="Field Units">C</Qualifier>
<Qualifier name="Upper Limit">Program Controlled</Qualifier>
<Qualifier name="Lower Limit">Program Controlled</Qualifier>
</ParameterValue>
</PropertyData>
` : ""}
${countSh > 0 ? `
<PropertyData property="pr5">
<Data format="string">-</Data>
<Qualifier name="Definition">Constant Pressure</Qualifier>
<Qualifier name="Field Variable Compatible">Temperature</Qualifier>
<Qualifier name="Symbol">Cᵨ</Qualifier>
<ParameterValue parameter="pa4" format="string">
<Data>Interpolation Options</Data>
<Qualifier name="AlgorithmType">Linear Multivariate</Qualifier>
<Qualifier name="Normalized">True</Qualifier>
<Qualifier name="Cached">True</Qualifier>
<Qualifier name="ExtrapolationType">Projection to the Bounding Box</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa13" format="float">
<Data>${shData}</Data>
<Qualifier name="Variable Type">${repeatDependent(countSh)}</Qualifier>
</ParameterValue>
<ParameterValue parameter="pa6" format="float">
<Data>${tDataSh}</Data>
<Qualifier name="Variable Type">${repeatIndependent(countSh)}</Qualifier>
<Qualifier name="Field Variable">Temperature</Qualifier>
<Qualifier name="Default Data">22</Qualifier>
<Qualifier name="Field Units">C</Qualifier>
<Qualifier name="Upper Limit">Program Controlled</Qualifier>
<Qualifier name="Lower Limit">Program Controlled</Qualifier>
</ParameterValue>
</PropertyData>
` : ""}
</BulkDetails>
</Material>
<Metadata>
<ParameterDetails id="pa0">
<Name>Red</Name>
<Unitless/>
</ParameterDetails>
<ParameterDetails id="pa1">
<Name>Green</Name>
<Unitless/>
</ParameterDetails>
<ParameterDetails id="pa2">
<Name>Blue</Name>
<Unitless/>
</ParameterDetails>
<ParameterDetails id="pa3">
<Name>Material Property</Name>
<Unitless/>
</ParameterDetails>
<ParameterDetails id="pa4">
<Name>Options Variable</Name>
<Unitless/>
</ParameterDetails>
<ParameterDetails id="pa5">
<Name>Density</Name>
<Units name="Density">
<Unit>
<Name>kg</Name>
</Unit>
<Unit power="-3">
<Name>m</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa6">
<Name>Temperature</Name>
<Units name="Temperature">
<Unit>
<Name>C</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa7">
<Name>Young's Modulus</Name>
<Units name="Stress">
<Unit>
<Name>Pa</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa8">
<Name>Poisson's Ratio</Name>
<Unitless/>
</ParameterDetails>
<ParameterDetails id="pa9">
<Name>Bulk Modulus</Name>
<Units name="Stress">
<Unit>
<Name>Pa</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa10">
<Name>Shear Modulus</Name>
<Units name="Stress">
<Unit>
<Name>Pa</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa11">
<Name>Coefficient of Thermal Expansion</Name>
<Units name="InvTemp1">
<Unit power="-1">
<Name>C</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa12">
<Name>Thermal Conductivity</Name>
<Units name="Thermal Conductivity">
<Unit>
<Name>W</Name>
</Unit>
<Unit power="-1">
<Name>m</Name>
</Unit>
<Unit power="-1">
<Name>C</Name>
</Unit>
</Units>
</ParameterDetails>
<ParameterDetails id="pa13">
<Name>Specific Heat</Name>
<Units name="Specific Heat Capacity">
<Unit>
<Name>J</Name>
</Unit>
<Unit power="-1">
<Name>kg</Name>
</Unit>
<Unit power="-1">
<Name>C</Name>
</Unit>
</Units>
</ParameterDetails>
<PropertyDetails id="pr0">
<Unitless/>
<Name>Color</Name>
</PropertyDetails>
<PropertyDetails id="pr1">
<Unitless/>
<Name>Density</Name>
</PropertyDetails>
<PropertyDetails id="pr2">
<Unitless/>
<Name>Elasticity</Name>
</PropertyDetails>
<PropertyDetails id="pr3">
<Unitless/>
<Name>Coefficient of Thermal Expansion</Name>
</PropertyDetails>
<PropertyDetails id="pr4">
<Unitless/>
<Name>Thermal Conductivity</Name>
</PropertyDetails>
<PropertyDetails id="pr5">
<Unitless/>
<Name>Specific Heat</Name>
</PropertyDetails>
</Metadata>
</MatML_Doc>
</Materials>
</EngineeringData>`;

  return xml;
};
