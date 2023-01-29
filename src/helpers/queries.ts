export const tokensQuery = `
query MyQuery($where: [TokenInput!] $endCursor: String) {
    tokens(
      where: {tokens: $where}
      pagination: {limit: 100, after: $endCursor}
      ){
    nodes{
        token{
            metadata
            content {
              mediaEncoding {
                ... on AudioEncodingTypes {
                  large
                  original
                }
              }
              mimeType
              url
              size
            }
            tokenUrl
            tokenContract {
              symbol
              totalSupply
              description
              chain
              collectionAddress
              name
              network
            }
            collectionAddress
            collectionName
            description
            networkInfo {
              chain
              network
            }
            tokenStandard
            mintInfo {
              toAddress
              originatorAddress
              mintContext {
                blockNumber
                transactionHash
                blockTimestamp
              }
            }
            name
            owner
            image {
              mediaEncoding {
                ... on ImageEncodingTypes {
                  large
                  poster
                  original
                  thumbnail
                }
              }
              mimeType
              size
              url
            }
            tokenId
            tokenUrlMimeType
        
        }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    }
}
  `;

/*
query MyQuery {
  token(
    token: {address: "0xb48fc73160b1e3c77709cd275c588a049c7266b2", tokenId: "9"}
  ) {
    token {
      metadata
      content {
        mediaEncoding {
          ... on AudioEncodingTypes {
            large
            original
          }
        }
        mimeType
        url
        size
      }
      tokenUrl
      tokenContract {
        symbol
        totalSupply
        description
        chain
        collectionAddress
        name
        network
      }
      collectionAddress
      collectionName
      description
      networkInfo {
        chain
        network
      }
      tokenStandard
      mintInfo {
        toAddress
        originatorAddress
        mintContext {
          blockNumber
          transactionHash
          blockTimestamp
        }
      }
      name
      owner
      image {
        mediaEncoding {
          ... on ImageEncodingTypes {
            large
            poster
            original
            thumbnail
          }
        }
        mimeType
        size
        url
      }
      tokenId
      tokenUrlMimeType
    }
  }
}
metadata
      content {
        mediaEncoding {
          ... on AudioEncodingTypes {
            large
            original
          }
        }
        mimeType
        url
        size
      }
      tokenUrl
      tokenContract {
        symbol
        totalSupply
        description
        chain
        collectionAddress
        name
        network
      }
      collectionAddress
      collectionName
      description
      networkInfo {
        chain
        network
      }
      tokenStandard
      mintInfo {
        toAddress
        originatorAddress
        mintContext {
          blockNumber
          transactionHash
          blockTimestamp
        }
      }
      name
      owner
      image {
        mediaEncoding {
          ... on ImageEncodingTypes {
            large
            poster
            original
            thumbnail
          }
        }
        mimeType
        size
        url
      }
      tokenId
      tokenUrlMimeType 
*/
