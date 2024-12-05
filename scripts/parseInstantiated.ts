export interface MAOInstances {
  govToken: string;
  govTokenAccessManager: string;
  ACIDInstance: string;
  ACIDAccessManager: string;
  rankToken: string;
}

export const parseInstantiated = (instances: string[]): MAOInstances => {
  return {
    govToken: instances[0],
    govTokenAccessManager: instances[1],
    ACIDInstance: instances[2],
    ACIDAccessManager: instances[10],
    rankToken: instances[11],
  };
};
