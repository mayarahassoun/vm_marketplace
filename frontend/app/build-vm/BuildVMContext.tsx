"use client"

import { createContext, useContext, useState } from "react"

type AdditionalDisk = {
  id: number
  label: string
  price: number
}

type BuildVMData = {
  vmName: string
  description: string
  password: string

  instanceId: string
  instanceName: string
  instanceCpu: string
  instanceRam: string
  instancePrice: number

  os: string

  storageSize: number
  storageType: "SSD" | "Business_SSD"
  storagePrice: number
  additionalDisks: AdditionalDisk[]

  bandwidthType: string
  bandwidthName: string
  bandwidthSize: number
  
  osName: string

    // VPC
  vpcMode: "existing" | "new"
  // existing VPC
  vpcId: string
  subnetId: string
  // new VPC
  vpcName: string
  vpcCidr: string
  subnetName: string
  subnetCidr: string
  gatewayIp: string
  primaryDns: string
  secondaryDns: string

  networkPrice: number

  region: string
  regionLabel: string
  regionPrice: number
}

type BuildVMContextType = {
  data: BuildVMData
  setData: React.Dispatch<React.SetStateAction<BuildVMData>>
}

const BuildVMContext = createContext<BuildVMContextType | undefined>(undefined)

export function BuildVMProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BuildVMData>({
    vmName: "My Custom VM",
    description: "",
    password: "",

    instanceId: "s6.medium.2",
    instanceName: "s6.medium.2",
    instanceCpu: "1 vCPU",
    instanceRam: "2 GB RAM",
    instancePrice: 10,

    os: "7f22f4d8-4863-45d6-befe-d19ba7e7563a",
    osName: "Ubuntu-Server-24",

    storageSize: 100,
    storageType: "SSD",
    storagePrice: 10,
    additionalDisks: [{ id: 1, label: "100 GB SSD", price: 10 }],

    bandwidthType: "External-01",
    bandwidthName: "",
    bandwidthSize: 5,


      // VPC
  vpcMode: "existing",
  vpcId: "",
  subnetId: "",
  vpcName: "",
  vpcCidr: "",
  subnetName: "",
  subnetCidr: "",
  gatewayIp: "",
  primaryDns: "8.8.8.8",
  secondaryDns: "8.8.4.4",

  networkPrice: 0,

    region: "tn-global-1",
    regionLabel: "tn-global-1 (Tunisia)",
    regionPrice: 10,

    
  })

  return (
    <BuildVMContext.Provider value={{ data, setData }}>
      {children}
    </BuildVMContext.Provider>
  )
}

export function useBuildVM() {
  const context = useContext(BuildVMContext)
  if (!context) {
    throw new Error("useBuildVM must be used inside BuildVMProvider")
  }
  return context
}
