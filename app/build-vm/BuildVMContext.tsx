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
    password: "BW3mgVX&5H5zl4PL",

    instanceId: "s6.medium.2",
    instanceName: "s6.medium.2",
    instanceCpu: "1 vCPU",
    instanceRam: "2 GB RAM",
    instancePrice: 10,

    os: "Ubuntu-Server-24",

    storageSize: 100,
    storageType: "SSD",
    storagePrice: 10,
    additionalDisks: [{ id: 1, label: "100 GB SSD", price: 10 }],

    bandwidthType: "External-01",
    bandwidthName: "",
    bandwidthSize: 5,
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