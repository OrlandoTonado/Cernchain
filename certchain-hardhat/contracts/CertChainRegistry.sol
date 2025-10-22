// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint32, euint64, euint256, externalEbool, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * CertChainRegistry
 * - 颁发与撤销证书；记录 IPFS CID、issuer、recipient、时间戳与可选有效期
 * - 使用 FHE 外部输入保障链上写入边界（例如有效期/课程标记等），并示范 ACL 授权
 */
contract CertChainRegistry is SepoliaConfig {
    struct Certificate {
        bytes32 certId;              // 唯一标识（建议前端基于 metadata/CID 计算）
        address issuer;              // 颁发机构
        address owner;               // 学员地址（可为零地址）
        string cid;                  // IPFS CID / metadata URI
        uint256 issuedAt;            // 链上颁发时间
        uint256 validUntil;          // 可选有效期（0 表示永久）
        ebool revoked;               // 撤销状态（加密布尔）
        euint32 courseTag;           // 课程标签（示例加密字段）
    }

    // issuer 注册信息（可选）
    struct IssuerMeta {
        string name;
        string metadataURI; // 机构介绍/官网等 IPFS URI
    }

    mapping(address => bool) private _isIssuer;
    mapping(address => IssuerMeta) private _issuerMeta;
    mapping(bytes32 => Certificate) private _certs;
    mapping(address => uint256) private _issuerNonce; // 每个机构一个自增 nonce，用于 on-chain 生成 certId

    event IssuerRegistered(address indexed issuer, string name, string metadataURI);
    event CertificateIssued(bytes32 indexed certId, address indexed issuer, address indexed recipient, string cid, uint256 issuedAt, uint256 validUntil);
    event CertificateRevoked(bytes32 indexed certId, address indexed issuer, string reason, uint256 revokedAt);
    event CertificateRestored(bytes32 indexed certId, address indexed issuer, uint256 restoredAt);
    event IssuerUpdated(address indexed issuer, string metadataURI);
    event TipPaid(bytes32 indexed certId, address indexed payer, uint256 amount, uint256 paidAt);

    modifier onlyIssuer() {
        require(_isIssuer[msg.sender], "NOT_ISSUER");
        _;
    }

    // 注册机构
    function registerIssuer(string calldata name, string calldata metadataURI) external {
        _isIssuer[msg.sender] = true;
        _issuerMeta[msg.sender] = IssuerMeta({ name: name, metadataURI: metadataURI });
        emit IssuerRegistered(msg.sender, name, metadataURI);
    }

    // 更新机构信息
    function updateIssuerMetadata(address issuer, string calldata metadataURI) external {
        require(msg.sender == issuer, "ONLY_SELF");
        require(_isIssuer[issuer], "NOT_ISSUER");
        _issuerMeta[issuer].metadataURI = metadataURI;
        emit IssuerUpdated(issuer, metadataURI);
    }

    function isIssuer(address addr) external view returns (bool) {
        return _isIssuer[addr];
    }

    function getIssuer(address issuer) external view returns (string memory name, string memory metadataURI) {
        IssuerMeta storage m = _issuerMeta[issuer];
        return (m.name, m.metadataURI);
    }

    /**
     * issueCertificate
     * - 使用 externalEuint32 作为课程标签输入，配合 proof 验证（FHE 外部输入范式）
     * - revoked 初始为 false（加密布尔），并将当前合约与 recipient 授权解密
     */
    function issueCertificate(
        address recipient,
        string calldata cid,
        bytes32 certId,
        uint256 validUntil,
        externalEuint32 courseTagExternal,
        bytes calldata proof
    ) external onlyIssuer {
        require(_certs[certId].issuedAt == 0, "DUP_CERTID");

        euint32 courseTag = FHE.fromExternal(courseTagExternal, proof);

        // 初始化撤销状态为 false（加密布尔），并进行最小化授权
        // 初始化为 false：构造一个必为假的比较表达式
        ebool revoked = FHE.eq(FHE.asEuint32(0), FHE.asEuint32(1));

        Certificate storage c = _certs[certId];
        c.certId = certId;
        c.issuer = msg.sender;
        c.owner = recipient;
        c.cid = cid;
        c.issuedAt = block.timestamp;
        c.validUntil = validUntil;
        c.revoked = revoked;
        c.courseTag = courseTag;

        // 将撤销状态的访问权限授权给：本合约与 recipient（便于必要时用户侧做私有解密核验）
        FHE.allowThis(c.revoked);
        if (recipient != address(0)) {
            FHE.allow(c.revoked, recipient);
        }

        // 同时为 courseTag 授权本合约与 recipient
        FHE.allowThis(c.courseTag);
        if (recipient != address(0)) {
            FHE.allow(c.courseTag, recipient);
        }

        emit CertificateIssued(certId, msg.sender, recipient, cid, c.issuedAt, validUntil);
    }

    /**
     * issueCertificateAuto
     * - 由合约在链上生成 certId（可复现且避免冲突）
     * - 生成方式：keccak256(issuer, recipient, cid, block.number, issuerNonce++)
     */
    function issueCertificateAuto(
        address recipient,
        string calldata cid,
        uint256 validUntil,
        externalEuint32 courseTagExternal,
        bytes calldata proof
    ) external onlyIssuer {
        bytes32 certId = keccak256(
            abi.encodePacked(msg.sender, recipient, cid, block.number, _issuerNonce[msg.sender]++)
        );

        euint32 courseTag = FHE.fromExternal(courseTagExternal, proof);

        ebool revoked = FHE.eq(FHE.asEuint32(0), FHE.asEuint32(1));

        Certificate storage c = _certs[certId];
        require(c.issuedAt == 0, "DUP_CERTID");
        c.certId = certId;
        c.issuer = msg.sender;
        c.owner = recipient;
        c.cid = cid;
        c.issuedAt = block.timestamp;
        c.validUntil = validUntil;
        c.revoked = revoked;
        c.courseTag = courseTag;

        FHE.allowThis(c.revoked);
        if (recipient != address(0)) {
            FHE.allow(c.revoked, recipient);
        }

        // 同时为 courseTag 授权本合约与 recipient
        FHE.allowThis(c.courseTag);
        if (recipient != address(0)) {
            FHE.allow(c.courseTag, recipient);
        }

        emit CertificateIssued(certId, msg.sender, recipient, cid, c.issuedAt, validUntil);
    }

    /**
     * revokeCertificate
     * - 撤销标记存储为 ebool；这里只做置位操作与事件记录
     */
    function revokeCertificate(bytes32 certId, string calldata reason) external onlyIssuer {
        Certificate storage c = _certs[certId];
        require(c.issuedAt != 0, "NOT_FOUND");
        require(c.issuer == msg.sender, "NOT_ISSUER_OWNER");

        // 将 revoked 设置为 true：构造一个必为真的比较表达式
        c.revoked = FHE.eq(FHE.asEuint32(1), FHE.asEuint32(1));
        FHE.allowThis(c.revoked);
        if (c.owner != address(0)) {
            FHE.allow(c.revoked, c.owner);
        }

        emit CertificateRevoked(certId, msg.sender, reason, block.timestamp);
    }

    /**
     * restoreCertificate
     * - 将撤销状态恢复为 false
     */
    function restoreCertificate(bytes32 certId) external onlyIssuer {
        Certificate storage c = _certs[certId];
        require(c.issuedAt != 0, "NOT_FOUND");
        require(c.issuer == msg.sender, "NOT_ISSUER_OWNER");
        c.revoked = FHE.eq(FHE.asEuint32(0), FHE.asEuint32(1));
        FHE.allowThis(c.revoked);
        if (c.owner != address(0)) {
            FHE.allow(c.revoked, c.owner);
        }
        emit CertificateRestored(certId, msg.sender, block.timestamp);
    }

    /**
     * getCertificate
     * - 返回公开字段与加密字段句柄
     */
    function getCertificate(bytes32 certId)
        external
        view
        returns (
            bytes32 outCertId,
            address issuer,
            address owner,
            string memory cid,
            uint256 issuedAt,
            uint256 validUntil,
            ebool revoked,
            euint32 courseTag
        )
    {
        Certificate storage c = _certs[certId];
        require(c.issuedAt != 0, "NOT_FOUND");
        return (c.certId, c.issuer, c.owner, c.cid, c.issuedAt, c.validUntil, c.revoked, c.courseTag);
    }

    /**
     * tipForView: 付费查看详情（演示用途）。
     * - 仅记录事件，不持久化状态；生产可将费用转给 issuer 或平台。
     */
    function tipForView(bytes32 certId) external payable {
        require(_certs[certId].issuedAt != 0, "NOT_FOUND");
        require(msg.value > 0, "NO_VALUE");
        emit TipPaid(certId, msg.sender, msg.value, block.timestamp);
    }
}


