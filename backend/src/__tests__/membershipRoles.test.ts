import { rolesForMembership } from '../service/lidgeldService';

const sorted = (roles: string[]) => [...roles].sort();

describe('rolesForMembership', () => {
  it('behoudt auteur en puzzlemaster bij een geldig lidmaatschap', () => {
    expect(sorted(rolesForMembership(['user', 'author', 'puzzlemaster'], true, false))).toEqual(
      sorted(['user', 'author', 'puzzlemaster']),
    );
  });

  it('behoudt de admin-rol van een bestuurslid zonder is_admin-vlag', () => {
    expect(sorted(rolesForMembership(['user', 'bestuurslid', 'admin', 'author'], true, false))).toEqual(
      sorted(['user', 'bestuurslid', 'admin', 'author']),
    );
  });

  it("voegt 'user' toe en haalt 'exlid' weg bij een hernieuwd lidmaatschap", () => {
    expect(sorted(rolesForMembership(['exlid'], true, false))).toEqual(['user']);
  });

  it('voegt admin toe als de is_admin-vlag aan staat', () => {
    expect(sorted(rolesForMembership(['user'], true, true))).toEqual(sorted(['user', 'admin']));
  });

  it('zet een verlopen lid op exlid', () => {
    expect(rolesForMembership(['user', 'author', 'puzzlemaster'], false, false)).toEqual(['exlid']);
  });
});
