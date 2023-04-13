import algosdk from 'algosdk'

export const algodClient = new algosdk.Algodv2(
  process.env.NEXT_PUBLIC_NODE_TOKEN,
  process.env.NEXT_PUBLIC_NODE_BASE_URL,
  process.env.NEXT_PUBLIC_NODE_PORT
)
